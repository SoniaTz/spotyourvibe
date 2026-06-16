import prisma from '../config/database.js';

export const getOrganizerDashboardAnalytics = async (req, res, next) => {
  try {
    const organizerId = req.user.id;

    // Get all events for this organizer with their bookings
    const events = await prisma.event.findMany({
      where: { organizerId },
      include: {
        _count: {
          select: { bookings: true }
        },
        bookings: {
          select: {
            id: true,
            seatsReserved: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    let totalTicketsSold = 0;
    const ticketsByDate = {};

    events.forEach(event => {
      event.bookings.forEach(booking => {
        totalTicketsSold += booking.seatsReserved;

        // Group by date for time series
        const dateKey = new Date(booking.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        if (!ticketsByDate[dateKey]) {
          ticketsByDate[dateKey] = 0;
        }
        ticketsByDate[dateKey] += booking.seatsReserved;
      });
    });

    // Build time series data
    const ticketSalesData = Object.entries(ticketsByDate)
      .map(([name, tickets]) => ({ name, tickets }))
      .sort((a, b) => {
        const dateA = new Date(a.name);
        const dateB = new Date(b.name);
        return dateA.getTime() - dateB.getTime();
      });

    // Get event-specific stats
    const eventStats = events.map(event => {
      const eventTicketsSold = event.bookings.reduce(
        (sum, b) => sum + b.seatsReserved, 0
      );
      return {
        id: event.id,
        title: event.title,
        status: event.status,
        ticketsSold: eventTicketsSold,
        totalBookings: event._count.bookings,
        capacityPercentage: event.maxCapacity > 0
          ? ((eventTicketsSold / event.maxCapacity) * 100).toFixed(1)
          : '0'
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalEvents: events.length,
          totalTicketsSold,
          totalBookings: events.reduce((sum, e) => sum + e._count.bookings, 0)
        },
        ticketSalesData,
        eventStats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getEventAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const event = await prisma.event.findFirst({
      where: {
        id,
        organizerId
      },
      include: {
        category: true,
        venue: true,
        bookings: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const ticketsSold = event.maxCapacity - event.availableSeats;
    const capacityPercentage = event.maxCapacity > 0
      ? ((ticketsSold / event.maxCapacity) * 100).toFixed(1)
      : '0';

    // Build ticket time series
    const ticketsByDate = {};
    event.bookings.forEach(booking => {
      const dateKey = new Date(booking.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      if (!ticketsByDate[dateKey]) {
        ticketsByDate[dateKey] = 0;
      }
      ticketsByDate[dateKey] += booking.seatsReserved;
    });

    const ticketSalesData = Object.entries(ticketsByDate)
      .map(([date, tickets]) => ({ date, tickets }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: {
        ...event,
        ticketsSold,
        capacityPercentage,
        ticketSalesData
      }
    });
  } catch (error) {
    next(error);
  }
};