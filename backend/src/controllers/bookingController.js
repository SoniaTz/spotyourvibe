import prisma from '../config/database.js';
import { createNotification, notifyAdmins } from './notificationController.js';

export const getEventSeats = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, seatingType: true, seatRows: true, seatColumns: true }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.seatingType !== 'assigned') {
      return res.status(400).json({ success: false, message: 'This event does not have assigned seating' });
    }

    const seats = await prisma.seat.findMany({
      where: { eventId },
      orderBy: [{ row: 'asc' }, { number: 'asc' }]
    });

    res.json({
      success: true,
      data: {
        seatingType: event.seatingType,
        rows: event.seatRows,
        columns: event.seatColumns,
        seats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { eventId, seatsReserved, seatLabels, contactName, contactEmail, contactPhone } = req.body;
    const userId = req.user.id;

    // Check if event exists and is approved
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot book tickets for this event. Event is not approved.'
      });
    }

    // Check if event has started
    if (new Date() > new Date(event.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book tickets for past events'
      });
    }

    // Check seat availability
    if (event.availableSeats < seatsReserved) {
      return res.status(400).json({
        success: false,
        message: `Only ${event.availableSeats} seats available`
      });
    }

    // For assigned seating, validate seat labels
    if (event.seatingType === 'assigned') {
      if (!seatLabels || !Array.isArray(seatLabels) || seatLabels.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please select specific seats for this event'
        });
      }

      // Check if seats are available
      const seats = await prisma.seat.findMany({
        where: {
          eventId,
          label: { in: seatLabels },
          status: 'available'
        }
      });

      if (seats.length !== seatLabels.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected seats are no longer available'
        });
      }
    }

    // Create booking and update available seats in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId,
          eventId,
          seatsReserved,
          seatNumbers: event.seatingType === 'assigned' ? JSON.stringify(seatLabels) : null,
          contactName,
          contactEmail,
          contactPhone
        },
        include: {
          event: {
            include: {
              venue: true,
              category: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Update available seats
      await tx.event.update({
        where: { id: eventId },
        data: {
          availableSeats: {
            decrement: seatsReserved
          }
        }
      });

      // For assigned seating, mark seats as booked
      if (event.seatingType === 'assigned' && seatLabels) {
        await tx.seat.updateMany({
          where: {
            eventId,
            label: { in: seatLabels }
          },
          data: {
            status: 'booked',
            bookingId: booking.id
          }
        });
      }

      return booking;
    });

    // Notify the event organizer about the new booking
    await createNotification(
      result.event.organizerId,
      'NEW_BOOKING',
      `New booking: ${result.user.name} booked ${seatsReserved} seat(s) for "${result.event.title}".`,
      eventId
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        event: {
          include: {
            venue: true,
            category: true,
            organizer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking, is admin, or is the event organizer
    const isOrganizer = req.user.role === 'ORGANIZER' && booking.event.organizerId === req.user.id;
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.id && !isOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this booking'
      });
    }

    // Check if event has already started
    if (new Date() > new Date(booking.event.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking for past events'
      });
    }

    // Delete booking and restore seats in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete booking
      await tx.booking.delete({
        where: { id }
      });

      // Restore available seats
      await tx.event.update({
        where: { id: booking.eventId },
        data: {
          availableSeats: {
            increment: booking.seatsReserved
          }
        }
      });

      // For assigned seating, release the seats
      if (booking.seatNumbers) {
        const seatLabels = JSON.parse(booking.seatNumbers);
        await tx.seat.updateMany({
          where: {
            eventId: booking.eventId,
            label: { in: seatLabels }
          },
          data: {
            status: 'available',
            bookingId: null
          }
        });
      }
    });

    // Get the user who cancelled so we can include their name
    const cancelUser = await prisma.user.findUnique({
      where: { id: booking.userId },
      select: { name: true }
    });
    const cancelUserName = cancelUser?.name || 'A user';

    // Notify the user whose booking was cancelled
    await createNotification(
      booking.userId,
      'BOOKING_CANCELLED',
      `Your booking for "${booking.event.title}" has been cancelled.`,
      booking.eventId
    );

    // Notify the event organizer about the cancellation
    await createNotification(
      booking.event.organizerId,
      'BOOKING_CANCELLED',
      `${cancelUserName} cancelled their booking (${booking.seatsReserved} seat(s)) for "${booking.event.title}".`,
      booking.eventId
    );

    // Notify admins about the cancellation
    await notifyAdmins(
      'BOOKING_CANCELLED',
      `${cancelUserName} cancelled a booking for "${booking.event.title}".`,
      booking.eventId
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            venue: true,
            category: true,
            organizer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check access rights
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};