import { useState, useEffect, useCallback } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Ticket, Calendar, MapPin, Download, QrCode, Clock, X, Loader2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiRequest, API_BASE_URL } from '../lib/api';
import { toast } from 'sonner';
import { formatTicketId } from '../lib/utils';
import { generateTicketPdf, downloadPdf } from '../lib/generateTicketPdf';

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
  userId: string;
  eventId: string;
  seatsReserved: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    image?: string;
    venue?: { name: string; city: string };
    category?: { name: string };
    organizer?: { id: string; name: string; email: string };
  };
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve image URL - handle local upload paths vs external URLs
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${imagePath}`;
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: Booking[] }>('/bookings/my');
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const now = new Date();
  const upcomingBookings = bookings.filter(b => new Date(b.event.startDate) > now);
  const pastBookings = bookings.filter(b => new Date(b.event.startDate) <= now);

  const handleViewTicket = (ticket: Booking) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const downloadTicket = async (booking: Booking) => {
    try {
      const orderNumber = formatTicketId(booking.id);
      const qrData = `EF-${orderNumber}-${booking.id}`;
      const ticketCount = booking.seatsReserved;

      // Fetch QR code
      let qrDataUrl: string | undefined;
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&bgcolor=FFFFFF&color=000000`;
        const qrResponse = await fetch(qrUrl);
        const qrBlob = await qrResponse.blob();
        qrDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(qrBlob);
        });
      } catch {
        // QR code fetch failed, will use fallback text
      }

      const doc = await generateTicketPdf({
        eventTitle: booking.event.title,
        orderNumber,
        startDate: booking.event.startDate,
        venueName: booking.event.venue?.name,
        venueCity: booking.event.venue?.city,
        ticketCount,
        contactName: booking.contactName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        qrDataUrl,
        qrFallbackText: orderNumber,
      });

      // Save the PDF
      downloadPdf(doc, `ticket-${orderNumber}.pdf`);
      toast.success('Ticket downloaded successfully!');
    } catch (err) {
      console.error('Ticket download failed (Dashboard):', err);
      toast.error('Failed to download ticket');
    }
  };

  const handleCancelReservation = async (bookingId: string) => {
    try {
      await apiRequest(`/bookings/${bookingId}`, { method: 'DELETE' });
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      if (selectedTicket?.id === bookingId) {
        setSelectedTicket(null);
        setShowTicketModal(false);
      }
      toast.success('Booking cancelled successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking');
    }
  };

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

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  const tickets = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl mb-2 text-gray-900">My Tickets</h1>
            <p className="text-gray-600">View and manage your event tickets</p>
          </div>
          {(!user || user.role === 'user') && (
            <Link
              to="/become-organizer"
              className="inline-flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg group mb-6"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Become an Organizer</div>
                <div className="text-xs text-purple-100">Create and sell tickets for your events</div>
              </div>
              <svg className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          )}

          {/* Stats */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Upcoming Events</span>
                <Ticket className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl text-gray-900">{upcomingBookings.length}</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Past Events</span>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl text-gray-900">{pastBookings.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'past'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Past Events ({pastBookings.length})
            </button>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading your tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl mb-2 text-gray-900">No tickets found</h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'upcoming'
                    ? "You don't have any upcoming events"
                    : "You haven't attended any events yet"}
                </p>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              tickets.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0">
                      <ImageWithFallback
                        src={getImageUrl(booking.event.image)}
                        alt={booking.event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 mb-1">
                            Order #{formatTicketId(booking.id)}
                          </div>
                          <h3 className="text-xl mb-3 text-gray-900">{booking.event.title}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(booking.event.startDate)} • {formatTime(booking.event.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{booking.event.venue?.name || 'TBA'}{booking.event.venue?.city ? `, ${booking.event.venue.city}` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Ticket className="w-4 h-4" />
                              <span>{booking.seatsReserved} seat{booking.seatsReserved !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleViewTicket(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                          View Ticket
                        </button>
                        <button
                          onClick={() => downloadTicket(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        {activeTab === 'upcoming' && (
                          <button
                            onClick={() => handleCancelReservation(booking.id)}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full flex flex-col max-h-[90vh]"
          >
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-indigo-100 mb-1">E-Ticket</div>
                  <div className="text-xl">{selectedTicket.event.title}</div>
                </div>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-sm text-indigo-100">
                {formatDate(selectedTicket.event.startDate)} • {formatTime(selectedTicket.event.startDate)}
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* QR Code */}
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`EF-${selectedTicket.id.slice(0, 8).toUpperCase()}-${selectedTicket.id}`)}&bgcolor=FFFFFF&color=000000`}
                  alt="Ticket QR Code"
                  className="w-48 h-48 rounded-lg border border-gray-200"
                />
              </div>

              {/* Ticket Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number</span>
                  <span className="text-gray-900 font-mono">{formatTicketId(selectedTicket.id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="text-gray-900 font-mono text-xs">{formatTicketId(selectedTicket.id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats</span>
                  <span className="text-gray-900">{selectedTicket.seatsReserved} seat{selectedTicket.seatsReserved !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue</span>
                  <span className="text-gray-900">{selectedTicket.event.venue?.name || 'TBA'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="text-gray-900">{selectedTicket.event.venue?.city || 'TBA'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Confirmed</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="text-gray-900">{selectedTicket.contactName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="text-gray-900">{selectedTicket.contactEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone</span>
                    <span className="text-gray-900">{selectedTicket.contactPhone}</span>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 text-center">Show this QR code at the venue entrance</p>
              </div>

              <button
                onClick={async () => {
                  try {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`EF-${selectedTicket.id.slice(0, 8).toUpperCase()}-${selectedTicket.id}`)}&bgcolor=FFFFFF&color=000000`;
                    
                    // Create a vCard pass with ticket details
                    const vcardData = [
                      'BEGIN:VCARD',
                      'VERSION:3.0',
                      `FN:${selectedTicket.event.title} - Ticket`,
                      `ORG:EventFlow`,
                      `TEL:${selectedTicket.contactPhone || ''}`,
                      `EMAIL:${selectedTicket.contactEmail || ''}`,
                      `NOTE:Order: ${formatTicketId(selectedTicket.id)}\\nSeats: ${selectedTicket.seatsReserved}\\nVenue: ${selectedTicket.event.venue?.name || 'TBA'}\\nDate: ${formatDate(selectedTicket.event.startDate)} at ${formatTime(selectedTicket.event.startDate)}\\nBooking ID: ${formatTicketId(selectedTicket.id)}`,
                      'END:VCARD'
                    ].join('\\n');
                    
                    const vcardBlob = new Blob([vcardData], { type: 'text/vcard' });
                    const vcardUrl = URL.createObjectURL(vcardBlob);
                    
                    // Try Web Share API first (mobile devices)
                    if (navigator.share) {
                      const qrResponse = await fetch(qrUrl);
                      const qrBlob = await qrResponse.blob();
                      const qrFile = new File([qrBlob], `ticket-${formatTicketId(selectedTicket.id)}.png`, { type: 'image/png' });
                      await navigator.share({
                        title: `${selectedTicket.event.title} - Ticket`,
                        text: `Your ticket for ${selectedTicket.event.title}`,
                        files: [qrFile]
                      });
                    } else {
                      // Fallback: download vCard for Apple Wallet / Google Wallet import
                      const link = document.createElement('a');
                      link.href = vcardUrl;
                      link.download = `ticket-${formatTicketId(selectedTicket.id)}.vcf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setTimeout(() => URL.revokeObjectURL(vcardUrl), 10000);
                      toast.success('vCard saved! Open it with Apple Wallet / Google Wallet.');
                    }
                  } catch (err) {
                    // Fallback to direct QR download
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`EF-${selectedTicket.id.slice(0, 8).toUpperCase()}-${selectedTicket.id}`)}&bgcolor=FFFFFF&color=000000`;
                    const link = document.createElement('a');
                    link.href = qrUrl;
                    link.download = `ticket-${formatTicketId(selectedTicket.id)}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('QR code downloaded! You can add it to your digital wallet.');
                  }
                }}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add to Wallet
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <Footer />
    </div>
  );
}