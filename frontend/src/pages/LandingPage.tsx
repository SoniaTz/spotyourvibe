import { useState, useEffect, useCallback } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import OrganizerRequiredModal from '../components/OrganizerRequiredModal';
import { ArrowRight, Ticket, Users, BarChart3, Shield, Zap, Calendar, MapPin, Loader2 } from 'lucide-react';
import { apiRequest, API_BASE_URL } from '../lib/api';
import { motion } from 'framer-motion';

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

interface TrendingEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  image?: string;
  bookings: number;
  featured: boolean;
  isFinished: boolean;
}

export default function LandingPage() {
  const { user } = useAuth();
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [trendingEvents, setTrendingEvents] = useState<TrendingEvent[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const navigate = useNavigate();

  // Resolve image URL - handle local upload paths vs external URLs
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http')) return imagePath;
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    // Only remove /api from the END of the URL, not from the domain name
    const baseUrl = API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    return `${baseUrl}${cleanPath}`;
  };

  const fetchTrendingEvents = useCallback(async () => {
    try {
      setTrendingLoading(true);
      const res = await apiRequest<{ success?: boolean; data?: any[] }>('/events');
      if (Array.isArray(res?.data)) {
        const events: TrendingEvent[] = res.data.map((e: any) => {
          const isFinished = e.startDate ? new Date(e.startDate) < new Date() : false;
          return {
            id: e.id,
            title: e.title,
            category: e.category?.name || 'General',
            date: e.startDate ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
            location: e.venue ? `${e.venue.name}${e.venue.city ? ', ' + e.venue.city : ''}` : 'TBA',
            image: getImageUrl(e.image),
            bookings: e._count?.bookings || 0,
            featured: false,
            isFinished
          };
        });

        // Sort: most bookings first, then newest (by startDate descending)
        events.sort((a, b) => {
          if (a.bookings !== b.bookings) return b.bookings - a.bookings;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // Take top 4
        const top4 = events.slice(0, 4);
        // Mark the one with most bookings as featured
        if (top4.length > 0 && top4[0].bookings > 0) {
          top4[0].featured = true;
        }

        setTrendingEvents(top4);
      }
    } catch {
      setTrendingEvents([]);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrendingEvents(); }, [fetchTrendingEvents]);

  const handleCreateEventClick = () => {
    if (!user) {
      window.location.href = '/signup';
      return;
    }
    if (user.role === 'user') {
      setShowOrganizerModal(true);
      return;
    }
    if (user.role === 'organizer') {
      navigate('/organizer/events/create');
    }
  };

  const features = [
    {
      icon: Ticket,
      title: 'Smart Seat Selection',
      description: 'Interactive seating charts with real-time availability and simple seat selection'
    },
    {
      icon: Users,
      title: 'Attendee Management',
      description: 'Comprehensive tools to manage registrations, check-ins, and communications'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Deep insights into attendance trends and event performance metrics'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Bank-level security with multiple payment methods and instant payouts'
    },
    {
      icon: Zap,
      title: 'Instant Updates',
      description: 'Real-time notifications for bookings, cancellations, and event changes'
    },
    {
      icon: Calendar,
      title: 'Event Scheduling',
      description: 'Powerful scheduling tools for recurring events and multi-day conferences'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full mb-6">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              <span className="text-sm text-indigo-700">Trusted by 100,000+ event organizers</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl mb-6 text-gray-900 leading-tight">
              Events that sell themselves
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              The complete platform to create, manage, and sell tickets for events of any size. 
              From intimate gatherings to stadium concerts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Events
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Events Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl mb-2 text-gray-900">Trending Events</h2>
              <p className="text-gray-600">Discover what's happening near you</p>
            </div>
            <Link
              to="/events"
              className="hidden sm:inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              View all events
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {trendingLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : trendingEvents.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600">Events will appear here once organizers create them.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {trendingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/events/${event.id}`} className="group block">
                    <div className="rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all">
                      <div className="relative h-56 overflow-hidden">
                        {event.image ? (
                          <ImageWithFallback
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-indigo-300" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-sm rounded-full">
                            {event.category}
                          </span>
                          {event.isFinished && (
                            <span className="ml-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-full">
                              Finished
                            </span>
                          )}
                        </div>
                        {event.featured && (
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-full font-medium">
                              Featured
                            </span>
                          </div>
                        )}
                        {event.bookings > 0 && (
                          <div className="absolute bottom-4 right-4">
                            <span className="px-3 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
                              {event.bookings} booking{event.bookings !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {event.title}
                        </h3>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        </div>
                        <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                          <span className="text-indigo-600 group-hover:gap-2 flex items-center gap-1 transition-all">
                            Get tickets
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View all events
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4 text-gray-900">Everything you need to succeed</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional tools designed for event organizers who demand excellence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl mb-4">Ready to create your event?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join thousands of organizers who trust SpotYourVibe to power their events
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!user ? (
                <button
                  onClick={handleCreateEventClick}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : user.role === 'user' ? (
                <Link
                  to="/become-organizer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Become an Organizer
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : user.role === 'organizer' ? (
                <button
                  onClick={() => navigate('/organizer/events/create')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Create Event
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Admin Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Organizer Required Modal */}
      <OrganizerRequiredModal
        isOpen={showOrganizerModal}
        onClose={() => setShowOrganizerModal(false)}
      />
    </div>
  );
}