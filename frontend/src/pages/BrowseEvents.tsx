import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Search, SlidersHorizontal, Calendar, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ImgHTMLAttributes } from 'react';
import { apiRequest, API_BASE_URL } from '../lib/api';

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

interface ApiEvent {
  id: string;
  title: string;
  shortDescription?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  venue?: { name: string; city?: string; address?: string };
  category?: { name: string };
  organizer?: { name: string };
  status?: string;
  availableSeats?: number;
  maxCapacity?: number;
}

interface MappedEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  image?: string;
  status: string;
  startDateRaw?: string;
  availableSeats?: number;
}

export default function BrowseEvents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [events, setEvents] = useState<MappedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-soonest');
  const categories = ['All', 'Music', 'Conference', 'Sports', 'Entertainment', 'Arts', 'Food & Drink'];
  const dateFilters = ['All Dates', 'Today', 'This Week', 'This Month', 'This Year'];

  // Resolve image URL - handle local upload paths vs external URLs
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${imagePath}`;
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success?: boolean; data?: ApiEvent[] }>('/events');
      if (Array.isArray(res?.data)) {
        const mapped = res.data.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category?.name || 'General',
          date: e.startDate ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
          time: e.startDate ? new Date(e.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
          location: e.venue ? `${e.venue.name}${e.venue.city ? ', ' + e.venue.city : ''}` : 'TBA',
          image: getImageUrl(e.image),
          status: (e.status || 'approved').toLowerCase(),
          startDateRaw: e.startDate,
          availableSeats: e.availableSeats
        }));
        setEvents(mapped);
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedCategory === 'all' || event.category.toLowerCase() === selectedCategory;

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch =
      normalizedQuery.length === 0 ||
      event.title.toLowerCase().includes(normalizedQuery) ||
      event.location.toLowerCase().includes(normalizedQuery) ||
      event.category.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date-soonest':
        return (a.startDateRaw || '').localeCompare(b.startDateRaw || '');
      case 'date-latest':
        return (b.startDateRaw || '').localeCompare(a.startDateRaw || '');
      case 'popular':
        return (a.availableSeats ?? Infinity) - (b.availableSeats ?? Infinity);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Search Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl lg:text-5xl mb-4 text-gray-900">Discover Events</h1>
          <p className="text-xl text-gray-600 mb-8">Find your next unforgettable experience</p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, venues, or organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category.toLowerCase())}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.toLowerCase()
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-3">Date Range</label>
                  <div className="space-y-2">
                    {dateFilters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedDate(filter.toLowerCase())}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                          selectedDate === filter.toLowerCase()
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>


                <div>
                  <label className="block text-sm text-gray-700 mb-3">Location</label>
                  <input
                    type="text"
                    placeholder="City or ZIP code"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button className="w-full mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-600">
              <span className="text-gray-900">{filteredEvents.length}</span> events found
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date-soonest">Date: Soonest</option>
              <option value="date-latest">Date: Latest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link to={`/events/${event.id}`} className="group block">
                  <div className="rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all">
                    <div className="relative h-56 overflow-hidden">
                      {event.image ? (
                        <ImageWithFallback
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-indigo-300" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-xs rounded-full">
                          {event.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-lg mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{event.date}{event.time ? ` • ${event.time}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1 text-indigo-600 group-hover:gap-2 transition-all">
                          View details
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

          {filteredEvents.length === 0 && (
            <div className="mt-10 text-center bg-white border border-gray-200 rounded-xl p-8">
              <h3 className="text-lg text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Try changing category or search keywords.</p>
            </div>
          )}

          {/* Load More */}
          {filteredEvents.length > 0 && (
            <div className="mt-12 text-center">
              <button className="px-8 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                Load More Events
              </button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
