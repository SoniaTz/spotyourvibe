import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Search, SlidersHorizontal, Calendar, MapPin, ArrowRight, Loader2, Sparkles, Tag, Music, Briefcase, Trophy, Film, Palette, Coffee, X } from 'lucide-react';
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
  const [locationQuery, setLocationQuery] = useState('');
  const [appliedLocationQuery, setAppliedLocationQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [events, setEvents] = useState<MappedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-soonest');
  const categoryIcons: Record<string, JSX.Element> = {
    all: <Sparkles className="w-4 h-4" />,
    music: <Music className="w-4 h-4" />,
    conference: <Briefcase className="w-4 h-4" />,
    sports: <Trophy className="w-4 h-4" />,
    entertainment: <Film className="w-4 h-4" />,
    arts: <Palette className="w-4 h-4" />,
    'food & drink': <Coffee className="w-4 h-4" />,
  };
  const categories = ['All', 'Music', 'Conference', 'Sports', 'Entertainment', 'Arts', 'Food & Drink'];
  const categoryToKey: Record<string, string> = {
    All: 'all', Music: 'music', Conference: 'conference', Sports: 'sports',
    Entertainment: 'entertainment', Arts: 'arts', 'Food & Drink': 'food & drink'
  };
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

    // Date filtering
    const now = new Date();
    let matchesDate = true;
    if (selectedDate !== 'all' && event.startDateRaw) {
      const eventDate = new Date(event.startDateRaw);
      switch (selectedDate) {
        case 'today':
          matchesDate =
            eventDate.getDate() === now.getDate() &&
            eventDate.getMonth() === now.getMonth() &&
            eventDate.getFullYear() === now.getFullYear();
          break;
        case 'this week': {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          matchesDate = eventDate >= startOfWeek && eventDate < endOfWeek;
          break;
        }
        case 'this month':
          matchesDate =
            eventDate.getMonth() === now.getMonth() &&
            eventDate.getFullYear() === now.getFullYear();
          break;
        case 'this year':
          matchesDate = eventDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    // Location filtering
    const normalizedLocation = appliedLocationQuery.trim().toLowerCase();
    const matchesLocation =
      normalizedLocation.length === 0 ||
      event.location.toLowerCase().includes(normalizedLocation);

    return matchesCategory && matchesSearch && matchesDate && matchesLocation;
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
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="absolute top-0 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-indigo-200 text-sm font-medium tracking-wide uppercase">Your Gateway to Experiences</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4 text-white">Discover Events</h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl">Find your next unforgettable experience</p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, venues, or organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg shadow-black/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all duration-200 shadow-lg ${
                showFilters 
                  ? 'bg-white text-indigo-600 shadow-indigo-500/25' 
                  : 'bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </motion.div>

          {/* Quick Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-thin"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category.toLowerCase())}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category.toLowerCase()
                    ? 'bg-white text-indigo-700 shadow-lg shadow-indigo-500/20 font-medium'
                    : 'bg-white/10 backdrop-blur-sm text-white/90 border border-white/20 hover:bg-white/20 hover:text-white'
                }`}
              >
                {categoryIcons[categoryToKey[category]]}
                {category}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 overflow-hidden shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Date Range
                  </label>
                  <div className="space-y-1.5">
                    {dateFilters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedDate(filter.toLowerCase())}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          selectedDate === filter.toLowerCase()
                            ? 'bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-200'
                            : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="City or ZIP code"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setAppliedLocationQuery(locationQuery); }}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setAppliedLocationQuery(locationQuery)}
                    className="w-full mt-2.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium shadow-md shadow-indigo-500/20"
                  >
                    Apply Filters
                  </button>
                  {appliedLocationQuery && (
                    <button
                      onClick={() => { setLocationQuery(''); setAppliedLocationQuery(''); }}
                      className="w-full mt-2 px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    >
                      Clear location filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-gray-500 text-sm">
                Showing <span className="text-gray-900 font-semibold">{filteredEvents.length}</span> {filteredEvents.length === 1 ? 'event' : 'events'}
              </p>
              {(selectedCategory !== 'all' || selectedDate !== 'all' || appliedLocationQuery) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                      <Tag className="w-3 h-3" />
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory('all')} className="ml-0.5 hover:text-indigo-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedDate !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
                      <Calendar className="w-3 h-3" />
                      {selectedDate}
                      <button onClick={() => setSelectedDate('all')} className="ml-0.5 hover:text-purple-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {appliedLocationQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">
                      <MapPin className="w-3 h-3" />
                      {appliedLocationQuery}
                      <button onClick={() => { setLocationQuery(''); setAppliedLocationQuery(''); }} className="ml-0.5 hover:text-amber-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors cursor-pointer"
              >
                <option value="date-soonest">Date: Soonest</option>
                <option value="date-latest">Date: Latest</option>
                <option value="popular">Most Popular</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-gray-500 text-sm font-medium">Discovering events...</p>
            </div>
          ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link to={`/events/${event.id}`} className="group block h-full">
                  <div className="h-full rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col">
                    <div className="relative h-56 overflow-hidden">
                      {event.image ? (
                        <ImageWithFallback
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                          <Calendar className="w-14 h-14 text-indigo-200 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      )}
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="absolute top-4 left-4 z-10">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-medium rounded-full shadow-sm">
                          {categoryIcons[event.category.toLowerCase()] || <Tag className="w-3 h-3" />}
                          {event.category}
                        </span>
                      </div>
                      
                      {/* Price badge or status */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${
                          event.status === 'approved' 
                            ? 'bg-emerald-500/90 text-white' 
                            : event.status === 'cancelled' 
                            ? 'bg-red-500/90 text-white'
                            : 'bg-amber-500/90 text-white'
                        }`}>
                          {event.status === 'approved' ? 'Available' : event.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-2.5 mb-4 flex-1">
                        <div className="flex items-center gap-2.5 text-gray-500 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                          </div>
                          <span className="truncate">{event.date}{event.time ? ` • ${event.time}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-gray-500 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-rose-500" />
                          </div>
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{event.availableSeats !== undefined ? `${event.availableSeats} seats left` : ''}</span>
                        <span className="inline-flex items-center gap-1.5 text-indigo-600 font-medium text-sm group-hover:gap-3 transition-all duration-200">
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

          {filteredEvents.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 text-center bg-white border border-gray-100 rounded-2xl p-12 shadow-sm max-w-lg mx-auto"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                <Search className="w-8 h-8 text-indigo-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">Try changing category or search keywords.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDate('all');
                  setLocationQuery('');
                  setAppliedLocationQuery('');
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-md shadow-indigo-500/20"
              >
                Clear all filters
              </button>
            </motion.div>
          )}

          {/* Load More */}
          {filteredEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-14 text-center"
            >
              <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
                Load More Events
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
