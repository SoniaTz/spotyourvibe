import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Heart, Calendar, MapPin, Ticket, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiRequest, API_BASE_URL } from '../lib/api';
import { toast } from 'sonner';

function ImageWithFallback(props: any) {
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

interface Event {
  id: string;
  title: string;
  shortDescription?: string;
  image?: string;
  startDate?: string;
  venue?: { name: string; city?: string };
  category?: { name: string };
  availableSeats?: number;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    return `${baseUrl}${imagePath}`;
  };

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem('favorites');
        if (stored) {
          const favoriteIds = JSON.parse(stored);
          // Fetch full event details for each favorite
          const fetchFavorites = async () => {
            const events = await Promise.all(
              favoriteIds.map((id: string) =>
                apiRequest<{ success: boolean; data: Event }>(`/events/${id}`).catch(() => null)
              )
            );
            const validEvents = events
              .filter((res: any) => res?.success && res.data)
              .map((res: any) => ({
                ...res.data,
                image: getImageUrl(res.data.image)
              }));
            setFavorites(validEvents);
          };
          fetchFavorites();
        }
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const removeFavorite = (eventId: string) => {
    const stored = localStorage.getItem('favorites');
    if (stored) {
      const favoriteIds = JSON.parse(stored);
      const updated = favoriteIds.filter((id: string) => id !== eventId);
      localStorage.setItem('favorites', JSON.stringify(updated));
      setFavorites(prev => prev.filter(e => e.id !== eventId));
      toast.success('Removed from favorites');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl mb-2 text-gray-900">My Favorites</h1>
            <p className="text-gray-600">Events you've saved for later</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">Start exploring events and save your favorites!</p>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all overflow-hidden">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      {event.image ? (
                        <ImageWithFallback
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-indigo-300" />
                        </div>
                      )}
                      <button
                        onClick={() => removeFavorite(event.id)}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-red-500 rounded-lg transition-colors"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg mb-3 text-gray-900 line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {event.venue?.name || 'TBA'}
                            {event.venue?.city ? `, ${event.venue.city}` : ''}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        View Details
                        <Ticket className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}