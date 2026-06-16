import prisma from '../config/database.js';
import { createNotification, notifyAdmins } from './notificationController.js';

export const getAllEvents = async (req, res, next) => {
  try {
    const { 
      search, 
      category, 
      venue, 
      startDate, 
      endDate, 
      availableOnly,
      status = 'APPROVED' 
    } = req.query;

    const where = {
      status: req.user?.role === 'ADMIN' ? undefined : 'APPROVED'
    };

    // Search by title
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Filter by category
    if (category) {
      where.categoryId = category;
    }

    // Filter by venue
    if (venue) {
      where.venueId = venue;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    // Filter by availability
    if (availableOnly === 'true') {
      where.availableSeats = {
        gt: 0
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        category: true,
        venue: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organizerApplication: {
              select: {
                phone: true,
                website: true,
                organizationName: true,
                description: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        venue: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organizerApplication: {
              select: {
                phone: true,
                website: true,
                organizationName: true,
                description: true
              }
            }
          }
        },
        bookings: {
          select: {
            id: true,
            seatsReserved: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Only allow viewing non-approved events if user is admin or event owner
    if (event.status !== 'APPROVED') {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.id !== event.organizerId)) {
        return res.status(403).json({
          success: false,
          message: 'Event not available'
        });
      }
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      shortDescription,
      fullDescription,
      importantInfo,
      lineup,
      seatingType,
      seatRows,
      seatColumns,
      startDate,
      endDate,
      maxCapacity,
      venueId,
      categoryId
    } = req.body;

    // Check if organizer is verified
    const application = await prisma.organizerApplication.findUnique({
      where: { userId: req.user.id }
    });

    if (!application || application.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'Organizer verification required. Please wait for admin approval.'
      });
    }

    // Handle image: file upload takes priority, then URL string from body
    const imagePath = req.file
      ? `/uploads/events/${req.file.filename}`
      : req.body.image || null;

    const isAssigned = seatingType === 'assigned';
    const parsedRows = isAssigned ? parseInt(seatRows) || 0 : 0;
    const parsedCols = isAssigned ? parseInt(seatColumns) || 0 : 0;
    const seatCount = isAssigned ? parsedRows * parsedCols : parseInt(maxCapacity);

    const event = await prisma.event.create({
      data: {
        title,
        shortDescription,
        fullDescription,
        importantInfo: importantInfo || null,
        lineup: lineup || null,
        seatingType: seatingType || 'general',
        seatRows: isAssigned ? parsedRows : null,
        seatColumns: isAssigned ? parsedCols : null,
        image: imagePath,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxCapacity: seatCount,
        availableSeats: seatCount,
        status: 'PENDING',
        organizerId: req.user.id,
        venueId,
        categoryId
      },
      include: {
        category: true,
        venue: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Generate seats if assigned seating
    if (isAssigned && parsedRows > 0 && parsedCols > 0) {
      const seatData = [];
      const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let r = 0; r < parsedRows; r++) {
        const rowLabel = rowLabels[r] || `R${r + 1}`;
        for (let c = 1; c <= parsedCols; c++) {
          seatData.push({
            eventId: event.id,
            row: rowLabel,
            number: c,
            label: `${rowLabel}${c}`,
            status: 'available'
          });
        }
      }
      await prisma.seat.createMany({ data: seatData });
    }

    // Notify all admins about the new event submission
    await notifyAdmins(
      'NEW_EVENT',
      `New event "${event.title}" submitted by ${req.user.name}. Awaiting approval.`
    );

    res.status(201).json({
      success: true,
      message: 'Event created successfully. Waiting for admin approval.',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if event exists and belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Only event owner or admin can update
    if (req.user.role !== 'ADMIN' && existingEvent.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this event'
      });
    }

    const {
      title,
      shortDescription,
      fullDescription,
      importantInfo,
      lineup,
      seatingType,
      startDate,
      endDate,
      maxCapacity,
      venueId,
      categoryId
    } = req.body;

    const updateData = {};

    // Only include provided fields
    if (title !== undefined) updateData.title = title;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (fullDescription !== undefined) updateData.fullDescription = fullDescription;
    if (importantInfo !== undefined) updateData.importantInfo = importantInfo;
    if (lineup !== undefined) updateData.lineup = lineup;
    if (seatingType !== undefined) updateData.seatingType = seatingType;
    if (venueId !== undefined) updateData.venueId = venueId;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    // Handle date conversion
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    // Handle maxCapacity - recalculate availableSeats
    if (maxCapacity !== undefined) {
      const parsedMaxCapacity = parseInt(maxCapacity);
      updateData.maxCapacity = parsedMaxCapacity;
      // Update available seats proportionally
      const bookedSeats = existingEvent.maxCapacity - existingEvent.availableSeats;
      updateData.availableSeats = parsedMaxCapacity - bookedSeats;
    }

    // Handle uploaded image: file upload takes priority, then URL string from body
    if (req.file) {
      updateData.image = `/uploads/events/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      updateData.image = req.body.image;
    }

    // If organizer updates event, reset status to pending and notify admins
    if (req.user.role === 'ORGANIZER') {
      updateData.status = 'PENDING';
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        venue: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Notify admins if organizer resubmitted for review
    if (req.user.role === 'ORGANIZER') {
      await notifyAdmins(
        'NEW_EVENT',
        `Event "${event.title}" has been updated and resubmitted for approval by ${req.user.name}.`
      );
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        bookings: true
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Only event owner or admin can delete
    if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this event'
      });
    }

    // Notify all users who had bookings
    if (event.bookings && event.bookings.length > 0) {
      const userIds = [...new Set(event.bookings.map(b => b.userId))];
      for (const userId of userIds) {
        await createNotification(
          userId,
          'EVENT_DELETED',
          `The event "${event.title}" you booked has been cancelled by the organizer. Your booking has been cancelled.`,
          event.id
        );
      }
      // Delete all bookings first
      await prisma.booking.deleteMany({ where: { eventId: id } });
    }

    await prisma.event.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        organizerId: req.user.id
      },
      include: {
        category: true,
        venue: true,
        _count: {
          select: {
            bookings: true
          }
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};
