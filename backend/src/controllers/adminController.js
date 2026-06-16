import prisma from '../config/database.js';
import { createNotification, notifyAdmins } from './notificationController.js';

// ============ ORGANIZER APPLICATIONS ============

export const getAllOrganizerApplications = async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const applications = await prisma.organizerApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

export const approveOrganizerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await prisma.organizerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application status and user role in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.organizerApplication.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'ORGANIZER' }
      });
    });

    // Notify the user via in-app notification
    await createNotification(
      application.userId,
      'ORGANIZER_APPROVED',
      'Your organizer application has been approved! You can now create events.'
    );

    // Notify all admins
    await notifyAdmins(
      'ORGANIZER_APPROVED',
      `Organizer application for "${application.organizationName || 'user'}" has been approved by an admin.`
    );

    res.json({
      success: true,
      message: 'Organizer application approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const rejectOrganizerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await prisma.organizerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await prisma.organizerApplication.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    // Notify the user via in-app notification
    await createNotification(
      application.userId,
      'ORGANIZER_REJECTED',
      'Your organizer application has been rejected.'
    );

    // Notify all admins
    await notifyAdmins(
      'ORGANIZER_REJECTED',
      `Organizer application for "${application.organizationName || 'user'}" has been rejected by an admin.`
    );

    res.json({
      success: true,
      message: 'Organizer application rejected'
    });
  } catch (error) {
    next(error);
  }
};

// ============ EVENTS ============

export const approveEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    // Notify the organizer
    await createNotification(
      event.organizerId,
      'EVENT_APPROVED',
      `Your event "${event.title}" has been approved!`,
      event.id
    );

    // Notify all admins
    await notifyAdmins(
      'EVENT_APPROVED',
      `Event "${event.title}" has been approved by an admin.`,
      event.id
    );

    res.json({
      success: true,
      message: 'Event approved successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const rejectEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    // Notify the organizer
    await createNotification(
      event.organizerId,
      'EVENT_REJECTED',
      `Your event "${event.title}" has been rejected.`,
      event.id
    );

    // Notify all admins
    await notifyAdmins(
      'EVENT_REJECTED',
      `Event "${event.title}" has been rejected by an admin.`,
      event.id
    );

    res.json({
      success: true,
      message: 'Event rejected',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// ============ USERS ============

export const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    const where = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        organizerApplication: {
          select: {
            id: true,
            organizationName: true,
            phone: true,
            description: true,
            website: true,
            status: true
          }
        },
        _count: {
          select: {
            bookings: true,
            events: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Prevent changing own role
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own account'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Prevent deleting a superadmin
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userToDelete.role === 'SUPERADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a Super Admin user'
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        venue: { select: { id: true, name: true } },
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if event has bookings
    const event = await prisma.event.findUnique({
      where: { id },
      include: { bookings: true }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Notify the organizer
    await createNotification(
      event.organizerId,
      'EVENT_DELETED',
      `Your event "${event.title}" has been deleted by an admin.`,
      event.id
    );

    // Notify all admins
    await notifyAdmins(
      'EVENT_DELETED',
      `Event "${event.title}" has been deleted by an admin.`,
      event.id
    );

    if (event.bookings && event.bookings.length > 0) {
      // Notify all users who had bookings
      const userIds = [...new Set(event.bookings.map(b => b.userId))];
      for (const userId of userIds) {
        await createNotification(
          userId,
          'EVENT_DELETED',
          `The event "${event.title}" you booked has been deleted. Your booking has been cancelled.`,
          event.id
        );
      }
      // Delete all bookings first
      await prisma.booking.deleteMany({ where: { eventId: id } });
    }

    await prisma.event.delete({ where: { id } });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============ BOOKINGS ============

export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        event: {
          include: {
            venue: true,
            category: true
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

export const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Delete booking and restore seats in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.booking.delete({ where: { id } });

      // Restore available seats
      await tx.event.update({
        where: { id: booking.eventId },
        data: { availableSeats: { increment: booking.seatsReserved } }
      });

      // For assigned seating, release the seats
      if (booking.seatNumbers) {
        const seatLabels = JSON.parse(booking.seatNumbers);
        await tx.seat.updateMany({
          where: { eventId: booking.eventId, label: { in: seatLabels } },
          data: { status: 'available', bookingId: null }
        });
      }
    });

    // Notify the user whose booking was deleted
    await createNotification(
      booking.userId,
      'BOOKING_CANCELLED',
      `Your booking for "${booking.event.title}" has been cancelled by an admin.`,
      booking.eventId
    );

    // Notify the event organizer about the cancellation
    await createNotification(
      booking.event.organizerId,
      'BOOKING_CANCELLED',
      `A booking for "${booking.event.title}" (${booking.seatsReserved} seat(s)) has been cancelled by an admin.`,
      booking.eventId
    );

    // Notify all admins
    await notifyAdmins(
      'BOOKING_CANCELLED',
      `A booking for "${booking.event.title}" has been cancelled by an admin.`,
      booking.eventId
    );

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============ VENUES ============

export const createVenue = async (req, res, next) => {
  try {
    const { name, address, city, capacity } = req.body;

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        city,
        capacity: parseInt(capacity)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

export const getAllVenues = async (req, res, next) => {
  try {
    const venues = await prisma.venue.findMany({
      include: {
        _count: {
          select: {
            events: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: venues
    });
  } catch (error) {
    next(error);
  }
};

export const updateVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, city, capacity } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (capacity) updateData.capacity = parseInt(capacity);

    const venue = await prisma.venue.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Venue updated successfully',
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVenue = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if venue has events
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        events: true
      }
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    if (venue.events.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete venue with existing events'
      });
    }

    await prisma.venue.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============ CATEGORIES ============

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    const category = await prisma.category.create({
      data: { name }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            events: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has events
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        events: true
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (category.events.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing events'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============ SUPERADMIN - MANAGE ADMINS ============

export const promoteToAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own account'
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    await createNotification(
      id,
      'ADMIN_PROMOTED',
      'You have been promoted to Admin by a Super Admin.'
    );

    // Notify all admins
    await notifyAdmins(
      'ADMIN_PROMOTED',
      `${user.name} has been promoted to Admin by a Super Admin.`
    );

    res.json({
      success: true,
      message: `${user.name} has been promoted to Admin`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const demoteFromAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own account'
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'SUPERADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a Super Admin'
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    // Check if user has an organizer application - restore to ORGANIZER if approved
    const organizerApp = await prisma.organizerApplication.findUnique({
      where: { userId: id }
    });
    const originalRole = organizerApp?.status === 'APPROVED' ? 'ORGANIZER' : 'USER';

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: originalRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    await createNotification(
      id,
      'ADMIN_DEMOTED',
      'Your Admin role has been removed by a Super Admin.'
    );

    // Notify all admins
    await notifyAdmins(
      'ADMIN_DEMOTED',
      `${user.name} has been removed from Admin by a Super Admin.`
    );

    res.json({
      success: true,
      message: `${user.name} has been removed from Admin`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// ============ DASHBOARD STATS ============

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalBookings,
      pendingApplications,
      pendingEvents
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.booking.count(),
      prisma.organizerApplication.count({
        where: { status: 'PENDING' }
      }),
      prisma.event.count({
        where: { status: 'PENDING' }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalBookings,
        pendingApplications,
        pendingEvents
      }
    });
  } catch (error) {
    next(error);
  }
};