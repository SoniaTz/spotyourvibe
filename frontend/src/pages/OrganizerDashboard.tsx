import { useState, useEffect } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Plus, Users, Ticket, Calendar, Edit, Eye, BarChart3, Loader2, Clock, ChevronDown, ChevronUp, XCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiRequest, API_BASE_URL } from '../lib/api';
import { toast } from 'sonner';

function ImageWithFallback(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);
  const { src, alt, style, className, ...rest } = props;

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==" alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={() => setDidError(true)} />
  );
}

interface Booking {
  id: string;
  seatsReserved: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  maxCapacity: number;
  availableSeats: number;
  image?: string;
  category?: { name: string };
  venue?: { name: string; city: string };
  _count?: { bookings: number };
  bookings?: Booking[];
}

interface AnalyticsData {
  summary: {
    totalEvents: number;
    totalTicketsSold: number;
    totalBookings: number;
  };
  ticketSalesData: { name: string; tickets: number }[];
  eventStats: {
    id: string;
    title: string;
    status: string;
    ticketsSold: number;
    totalBookings: number;
    capacityPercentage: string;
  }[];
}

export default function OrganizerDashboard() {
  const [timeframe, setTimeframe] = useState('30d');
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<{ id: string; eventId: string } | null>(null);

  // Resolve image URL - handle local upload paths vs external URLs
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${imagePath}`;
  };

  // Fetch organizer's events and analytics
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, analyticsRes] = await Promise.all([
          apiRequest<{success: boolean, data: Event[]}>('/events/my/events'),
          apiRequest<{success: boolean, data: AnalyticsData}>('/analytics/dashboard'),
        ]);

        if (eventsRes.success && eventsRes.data) {
          const eventsWithImages = eventsRes.data.map((e: Event) => ({
            ...e,
            image: getImageUrl(e.image)
          }));
          setMyEvents(eventsWithImages);
        }

        if (analyticsRes.success && analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const stats = [
    {
      label: 'Total Tickets Sold',
      value: analytics?.summary.totalTicketsSold.toLocaleString() || '0',
      change: '',
      icon: Ticket,
      color: 'indigo'
    },
    {
      label: 'Total Events',
      value: String(analytics?.summary.totalEvents || myEvents.length),
      change: '',
      icon: Calendar,
      color: 'blue'
    },
    {
      label: 'Total Bookings',
      value: String(analytics?.summary.totalBookings || 0),
      change: '',
      icon: Users,
      color: 'purple'
    },
    {
      label: 'Pending Review',
      value: String(myEvents.filter(e => e.status === 'PENDING').length),
      change: '',
      icon: Clock,
      color: 'yellow'
    },
  ];

  const ticketSalesChartData = analytics?.ticketSalesData?.length
    ? analytics.ticketSalesData
    : [{ name: 'No data', tickets: 0 }];

  const toggleBookings = (eventId: string) => {
    setExpandedBookings(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const formatBookingDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await apiRequest(`/events/${eventId}`, { method: 'DELETE' });
      setMyEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    }
    setEventToDelete(null);
  };

  const cancelBooking = async (bookingId: string, eventId: string) => {
    try {
      await apiRequest(`/bookings/${bookingId}`, { method: 'DELETE' });
      // Update local state
      setMyEvents(prev => prev.map(e => {
        if (e.id === eventId) {
          const cancelledBooking = e.bookings?.find(b => b.id === bookingId);
          return {
            ...e,
            availableSeats: e.availableSeats + (cancelledBooking?.seatsReserved || 0),
            bookings: e.bookings?.filter(b => b.id !== bookingId) || [],
            _count: { bookings: (e._count?.bookings || 1) - 1 }
          };
        }
        return e;
      }));
      toast.success('Booking cancelled successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking');
    }
    setBookingToCancel(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl mb-2 text-gray-900">Organizer Dashboard</h1>
              <p className="text-gray-600">Manage your events and track performance</p>
            </div>
            <Link
              to="/organizer/events/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">{stat.label}</span>
                  <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl text-gray-900">{stat.value}</div>
                  {stat.change && (
                    <div className="text-sm text-green-600 mb-1">{stat.change}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Ticket Sales Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <h2 className="text-lg mb-6 text-gray-900">Ticket Sales Over Time</h2>
            {ticketSalesChartData.length > 0 && ticketSalesChartData[0].name !== 'No data' ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ticketSalesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="tickets" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No ticket sales yet. Bookings will appear here.
              </div>
            )}
          </div>

          {/* Events List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg text-gray-900">My Events</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-10 text-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                </div>
              ) : myEvents.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  No events yet. Create your first event to get started!
                </div>
              ) : myEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Image */}
                    <div className="w-full sm:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl text-gray-900 truncate">{event.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              event.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : event.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Available</div>
                          <div className="text-lg text-gray-900">
                            {event.availableSeats.toLocaleString()} / {event.maxCapacity.toLocaleString()}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${((event.maxCapacity - event.availableSeats) / event.maxCapacity) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Category</div>
                          <div className="text-lg text-gray-900">
                            {event.category?.name || 'General'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Venue</div>
                          <div className="text-lg text-gray-900">
                            {event.venue?.name || 'TBD'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to={`/organizer/events/${event.id}/analytics`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                          View Analytics
                        </Link>
                        <Link
                          to={`/organizer/events/${event.id}/edit`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Event
                        </Link>
                        <Link
                          to={`/events/${event.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Page
                        </Link>
                        <button
                          onClick={() => setEventToDelete(event.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Event
                        </button>
                        {event.bookings && event.bookings.length > 0 && (
                          <button
                            onClick={() => toggleBookings(event.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            Bookings ({event.bookings.length})
                            {expandedBookings.has(event.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      {/* Bookings Section */}
                      {expandedBookings.has(event.id) && event.bookings && event.bookings.length > 0 && (
                        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700">Bookings ({event.bookings.length})</h4>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {event.bookings.map((booking) => (
                              <div key={booking.id} className="px-4 py-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                                    <div className="text-xs text-gray-500">{booking.user.email}</div>
                                    {booking.contactName && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium">Contact Name:</span> {booking.contactName}
                                      </div>
                                    )}
                                    {booking.contactEmail && (
                                      <div className="text-xs text-gray-500">
                                        <span className="font-medium">Contact Email:</span> {booking.contactEmail}
                                      </div>
                                    )}
                                    {booking.contactPhone && (
                                      <div className="text-xs text-gray-500">
                                        <span className="font-medium">Contact Phone:</span> {booking.contactPhone}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="text-gray-900 font-medium">{booking.seatsReserved}</div>
                                      <div className="text-xs text-gray-500">seats</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">{formatBookingDate(booking.createdAt)}</div>
                                    </div>
                                    <button
                                      onClick={() => setBookingToCancel({ id: booking.id, eventId: event.id })}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Cancel booking"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Delete Event Modal */}
      <ConfirmModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={() => eventToDelete && deleteEvent(eventToDelete)}
        title="Delete Event"
        message="Are you sure you want to delete this event? All bookings will be cancelled and users will be notified. This action cannot be undone."
        confirmText="Delete Event"
        cancelText="Keep Event"
        variant="danger"
      />

      {/* Cancel Booking Modal */}
      <ConfirmModal
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={() => bookingToCancel && cancelBooking(bookingToCancel.id, bookingToCancel.eventId)}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        variant="warning"
      />
      <Footer />
    </div>
  );
}
