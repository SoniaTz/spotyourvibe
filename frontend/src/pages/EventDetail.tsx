import { useState, useEffect } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SeatMap from '../components/SeatMap';
import { apiRequest } from '../lib/api';
import { Calendar, MapPin, Clock, Share2, Heart, ArrowRight, X, Ticket, Info, LogIn, Loader2, Mail, Phone, Building2, Globe } from 'lucide-react';

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

interface Seat {
  id: string;
  row: string;
  number: number;
  status: 'available' | 'selected' | 'sold' | 'reserved' | 'held' | 'booked';
  section: string;
}

interface OrganizerContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizerApplication?: {
    phone?: string;
    website?: string;
    organizationName?: string;
    description?: string;
  } | null;
}

interface ApiEvent {
  id: string;
  title: string;
  shortDescription?: string;
  fullDescription?: string;
  importantInfo?: string;
  lineup?: string;
  seatingType?: string;
  maxTicketsPerOrder?: number;
  image?: string;
  startDate?: string;
  endDate?: string;
  venue?: { name: string; address?: string; city?: string };
  category?: { name: string };
  organizer?: OrganizerContact;
  availableSeats?: number;
  maxCapacity?: number;
  status?: string;
}

export default function EventDetail() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const hasAssignedSeating = event?.seatingType === 'assigned';

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError('Event ID not found');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await apiRequest<{ success: boolean; data: ApiEvent }>(`/events/${eventId}`);
        if (res.success && res.data) {
          setEvent(res.data);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZlJTIwbXVzaWMlMjBmZXN0aXZhbCUyMGNyb3dkfGVufDF8fHx8MTc4MTE5NjI4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex flex-col items-center justify-center py-32">
          <h2 className="text-xl text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The event you are looking for does not exist.'}</p>
          <Link to="/events" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    if (hasAssignedSeating && selectedSeats.length > 0) {
      navigate('/checkout', { state: { event, selectedSeats } });
    } else {
      navigate('/checkout', { state: { event } });
    }
  };

  const organizer = event.organizer;
  const orgApp = organizer?.organizerApplication;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Image */}
      <div className="relative h-[400px] bg-gray-900">
        <ImageWithFallback
          src={getImageUrl(event.image)}
          alt={event.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Breadcrumb */}
        <div className="absolute top-20 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Link to="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link to="/events" className="hover:text-white">Events</Link>
              <span>/</span>
              <span className="text-white">{event.title}</span>
            </div>
          </div>
        </div>

        {/* Event Header */}
        <div className="absolute bottom-0 left-0 right-0 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <span className="text-sm text-white">{event.category?.name || 'Event'}</span>
                </div>
                <h1 className="text-4xl lg:text-5xl mb-2 text-white">{event.title}</h1>
                <p className="text-lg text-white/90">{event.shortDescription || ''}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <button className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info Cards */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <Calendar className="w-5 h-5 text-indigo-600 mb-2" />
                <div className="text-sm text-gray-600">Date</div>
                <div className="text-gray-900">{formatDate(event.startDate)}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <Clock className="w-5 h-5 text-indigo-600 mb-2" />
                <div className="text-sm text-gray-600">Time</div>
                <div className="text-gray-900">{event.startDate ? formatTime(event.startDate) : 'TBD'}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <MapPin className="w-5 h-5 text-indigo-600 mb-2" />
                <div className="text-sm text-gray-600">Venue</div>
                <div className="text-gray-900 truncate">{event.venue?.name || 'TBA'}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                {['about', 'lineup'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-6 py-4 text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                {event.seatingType === 'assigned' && (
                  <button
                    key="seats"
                    onClick={() => setActiveTab('seats')}
                    className={`flex-1 px-6 py-4 text-sm capitalize transition-colors ${
                      activeTab === 'seats'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Select Seats
                  </button>
                )}
              </div>

              <div className="p-6">
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl mb-3 text-gray-900">About This Event</h3>
                      <p className="text-gray-700 leading-relaxed">{event.fullDescription || event.shortDescription || 'No description available.'}</p>
                    </div>
                    <div>
                      <h3 className="text-xl mb-3 text-gray-900">Venue</h3>
                      <p className="text-gray-700">{event.venue?.name || 'TBA'}</p>
                      <p className="text-gray-600 text-sm mt-1">{event.venue?.address || ''} {event.venue?.city ? `, ${event.venue.city}` : ''}</p>
                      <button
                        onClick={() => {
                          const venueAddress = [event.venue?.address, event.venue?.city].filter(Boolean).join(', ');
                          const query = encodeURIComponent(venueAddress || event.venue?.name || '');
                          window.open(`https://www.google.com/maps/search/${query}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="mt-3 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        View on Map
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl mb-3 text-gray-900">Important Information</h3>
                      {event.importantInfo ? (
                        <ul className="space-y-2 text-gray-700 text-sm">
                          {(() => {
                            try {
                              const infoItems = JSON.parse(event.importantInfo);
                              return Array.isArray(infoItems) ? infoItems.map((item: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              )) : null;
                            } catch {
                              return <li className="flex items-start gap-2"><Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" /><span>{event.importantInfo}</span></li>;
                            }
                          })()}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No important information provided.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'seats' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl mb-2 text-gray-900">Select Your Seats</h3>
                      <p className="text-gray-600 text-sm">Click on available seats to select them. Maximum {event.maxTicketsPerOrder || 10} seats per order.</p>
                    </div>
                    <SeatMap
                      eventId={eventId || ''}
                      maxTickets={event.maxTicketsPerOrder || 10}
                      onSelectionChange={(seats) => setSelectedSeats(seats.map(s => ({ id: s.id, row: s.row, number: s.number, status: s.status, section: s.row })))}
                    />
                  </div>
                )}

                {activeTab === 'lineup' && (
                  <div>
                    <h3 className="text-xl mb-4 text-gray-900">Artist Lineup</h3>
                    {event.lineup ? (
                      <div className="space-y-3">
                        {(() => {
                          try {
                            const lineupItems = JSON.parse(event.lineup);
                            return Array.isArray(lineupItems) ? lineupItems.map((artist: string, index: number) => (
                              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="text-gray-900">{artist}</div>
                                  {index === 0 && (
                                    <div className="text-sm text-indigo-600">Main Act</div>
                                  )}
                                </div>
                              </div>
                            )) : null;
                          } catch {
                            return <p className="text-gray-700">{event.lineup}</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-600">No lineup information available for this event.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Organizer Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg mb-4 text-gray-900">Event Organizer</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                  {organizer?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{organizer?.name || 'Unknown Organizer'}</span>
                  </div>
                  <div className="text-sm text-gray-600">Event Organizer</div>
                  {orgApp?.organizationName && (
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {orgApp.organizationName}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Availability</div>
                  <div className="text-sm text-green-600">
                    {event.availableSeats ? `${event.availableSeats} seats available` : 'Limited seats available'}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {hasAssignedSeating && selectedSeats.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-700">Selected Seats ({selectedSeats.length})</span>
                        <button
                          onClick={() => setSelectedSeats([])}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSeats.map((seat) => (
                          <span
                            key={seat.id}
                            className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full"
                          >
                            {seat.row}{seat.number}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={handleProceedToCheckout}
                        disabled={hasAssignedSeating && selectedSeats.length === 0}
                        className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        <Ticket className="w-5 h-5" />
                        {hasAssignedSeating ? 'Select Seats & Reserve' : 'Reserve Tickets'}
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <p className="text-xs text-gray-600 text-center">
                        {hasAssignedSeating
                          ? 'Select your seats above, then click to reserve'
                          : 'Choose your quantity on the next page'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        state={{ from: location }}
                        className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-5 h-5" />
                        Sign In to Book Tickets
                      </Link>
                      <p className="text-xs text-gray-600 text-center">
                        Create an account or sign in to book tickets
                      </p>
                    </>
                  )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Info className="w-4 h-4" />
                    <span>Free cancellation up to 24 hours before event</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Organizer Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowContactModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {organizer?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{organizer?.name || 'Organizer'}</h3>
                  {orgApp?.organizationName && (
                    <p className="text-[11px] text-gray-500">{orgApp.organizationName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-500 font-medium">Email</div>
                  {organizer?.email ? (
                    <a
                      href={`mailto:${organizer.email}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium truncate block"
                    >
                      {organizer.email}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Not provided</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-500 font-medium">Phone</div>
                  {organizer?.phone || orgApp?.phone ? (
                    <a
                      href={`tel:${organizer?.phone || orgApp?.phone}`}
                      className="text-sm text-green-600 hover:text-green-700 font-medium truncate block"
                    >
                      {organizer?.phone || orgApp?.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Not provided</p>
                  )}
                </div>
              </div>

              {/* Website */}
              {orgApp?.website && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-500 font-medium">Website</div>
                    <a
                      href={orgApp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium truncate block"
                    >
                      {orgApp.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              {/* Description */}
              {orgApp?.description && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-500 font-medium">About</div>
                    <p className="text-sm text-gray-700">{orgApp.description}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowContactModal(false)}
                className="w-full py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
