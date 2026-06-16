import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { ArrowLeft, BarChart3, Users, Ticket, Calendar, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiRequest } from '../lib/api';

interface EventAnalytics {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  availableSeats: number;
  image?: string;
  category?: { name: string };
  venue?: { name: string; city: string };
  bookings: {
    id: string;
    seatsReserved: number;
    createdAt: string;
    user: { name: string; email: string };
  }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function EventAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    const fetchEventAnalytics = async () => {
      if (!id) return;
      try {
        const res = await apiRequest<{ success: boolean; data: EventAnalytics }>(`/events/${id}`);
        if (res.success && res.data) {
          setEvent(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center py-16">
            <h2 className="text-2xl text-gray-900 mb-4">Event not found</h2>
            <Link to="/organizer/dashboard" className="text-indigo-600 hover:text-indigo-800">
              Go back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ticketsSold = event.maxCapacity - event.availableSeats;
  const capacityPercentage = event.maxCapacity > 0 ? (ticketsSold / event.maxCapacity) * 100 : 0;

  // Prepare chart data from bookings
  const bookingsByDate = event.bookings?.reduce((acc: Record<string, number>, booking) => {
    const date = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + booking.seatsReserved;
    return acc;
  }, {}) || {};

  const ticketSalesData = Object.entries(bookingsByDate).map(([date, tickets]) => ({ name: date, tickets }));

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/organizer/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl text-gray-900">Event Analytics</h1>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[event.status] || 'bg-gray-100 text-gray-700'}`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-gray-600">{event.title}</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Tickets Sold</span>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{ticketsSold}</div>
              <div className="text-sm text-gray-500 mt-1">of {event.maxCapacity} available</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Capacity</span>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{capacityPercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-500 mt-1"> seats filled</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Total Bookings</span>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{event.bookings?.length || 0}</div>
              <div className="text-sm text-gray-500 mt-1"> orders</div>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Ticket Sales Over Time */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg mb-6 text-gray-900">Ticket Sales Over Time</h2>
              {ticketSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ticketSalesData}>
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
                    <Line type="monotone" dataKey="tickets" stroke="#6366f1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No ticket sales data available yet
                </div>
              )}
            </div>

            {/* Capacity Utilization */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg mb-6 text-gray-900">Capacity Utilization</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Sold', value: ticketsSold },
                      { name: 'Available', value: event.availableSeats }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                  <span className="text-sm text-gray-600">Sold ({ticketsSold})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-full" />
                  <span className="text-sm text-gray-600">Available ({event.availableSeats})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg text-gray-900">Recent Bookings</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {event.bookings && event.bookings.length > 0 ? (
                event.bookings.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                      <div className="text-sm text-gray-500">{booking.user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{booking.seatsReserved} tickets</div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No bookings yet
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg text-gray-900 mb-4">Event Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Event Date</div>
                <div className="text-gray-900">
                  {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Venue</div>
                <div className="text-gray-900">
                  {event.venue?.name || 'TBD'}
                  {event.venue?.city && `, ${event.venue.city}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Category</div>
                <div className="text-gray-900">{event.category?.name || 'General'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className="text-gray-900 capitalize">{event.status.toLowerCase()}</div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Link
                to={`/events/${event.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Event Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
