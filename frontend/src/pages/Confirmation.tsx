import { useLocation, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { CheckCircle, Download, Mail, Calendar, MapPin, Ticket, Share2, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatTicketId } from '../lib/utils';
import { generateTicketPdf, downloadPdf, formatDate, formatTime } from '../lib/generateTicketPdf';

export default function Confirmation() {
  const location = useLocation();
  const { event, selectedSeats, orderNumber, booking, contactInfo } = location.state || {};


  if (!event || !orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4 text-gray-900">Booking not found</h2>
          <Link to="/events" className="text-indigo-600 hover:text-indigo-700">
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  const ticketCount = booking?.seatsReserved || selectedSeats?.length || 1;
  const qrData = `EF-${orderNumber}-${booking?.id || 'ticket'}`;

  const downloadTicket = async () => {
    try {
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
        eventTitle: event.title,
        orderNumber,
        startDate: event.startDate,
        venueName: event.venue?.name,
        venueCity: event.venue?.city,
        ticketCount,
        contactName: contactInfo ? contactInfo.firstName + ' ' + contactInfo.lastName : undefined,
        contactEmail: contactInfo?.email,
        contactPhone: contactInfo?.phone,
        seatLabels: selectedSeats?.map((s: any) => `${s.row}${s.number}`),
        qrDataUrl,
        qrFallbackText: orderNumber,
      });

      // Save the PDF
      downloadPdf(doc, `ticket-${orderNumber}.pdf`);
    } catch (err) {
      console.error('Ticket download failed (Confirmation):', err);
      toast.error('Failed to generate ticket PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl mb-3 text-gray-900">Booking Confirmed!</h1>
            <p className="text-xl text-gray-600">
              Your tickets have been reserved successfully
            </p>
          </motion.div>

          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-indigo-100 mb-1">Order Number</div>
                  <div className="text-2xl font-mono">{orderNumber}</div>
                </div>
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                  {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Event Title */}
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-1">{event.title}</h3>
                {event.shortDescription && (
                  <p className="text-sm text-gray-600">{event.shortDescription}</p>
                )}
              </div>

              {/* Event Details Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Date</div>
                    <div className="text-sm text-gray-900">{formatDate(event.startDate)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Time</div>
                    <div className="text-sm text-gray-900">{formatTime(event.startDate)}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Venue</div>
                  <div className="text-sm text-gray-900">
                    {event.venue?.name || 'TBA'}
                    {event.venue?.city ? `, ${event.venue.city}` : ''}
                  </div>
                  {event.venue?.address && (
                    <div className="text-xs text-gray-500">{event.venue.address}</div>
                  )}
                </div>
              </div>

              {event.category && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Ticket className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Category</div>
                    <div className="text-sm text-gray-900">{event.category.name || event.category}</div>
                  </div>
                </div>
              )}

              {event.organizer && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Organizer</div>
                    <div className="text-sm text-gray-900">{event.organizer.name}</div>
                  </div>
                </div>
              )}

              {/* Seats */}
              {selectedSeats && selectedSeats.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Your Seats</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedSeats.map((seat: any) => (
                      <div key={seat.id} className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-lg text-gray-900">{seat.row}{seat.number}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {contactInfo && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Name</div>
                        <div className="text-sm text-gray-900">{contactInfo.firstName} {contactInfo.lastName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-sm text-gray-900">{contactInfo.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Ticket className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="text-sm text-gray-900">{contactInfo.phone}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code & Booking Info */}
              {booking && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    {/* QR Code */}
                    <div className="flex-shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&bgcolor=FFFFFF&color=000000`}
                        alt="Ticket QR Code"
                        className="w-40 h-40 rounded-lg border border-gray-200"
                      />
                    </div>
                    {/* Booking Details */}
                    <div className="flex-1 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Booking ID</span>
                        <span className="text-gray-900 font-mono text-xs">{formatTicketId(booking.id)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tickets Reserved</span>
                        <span className="text-gray-900">{ticketCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Confirmed</span>
                      </div>
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 text-center">Show this QR code at the venue entrance</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid sm:grid-cols-2 gap-4 mb-8"
          >
            <button
              onClick={downloadTicket}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Tickets
            </button>
            <button
              onClick={async () => {
                try {
                  // Fetch QR code
                  let qrDataUrl: string | undefined;
                  try {
                    const qrUrl_ = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&bgcolor=FFFFFF&color=000000`;
                    const qrR = await fetch(qrUrl_);
                    const qrB = await qrR.blob();
                    qrDataUrl = await new Promise<string>(r => { const fr = new FileReader(); fr.onloadend = () => r(fr.result as string); fr.readAsDataURL(qrB); });
                  } catch {
                    // QR code fetch failed
                  }

                  const doc = await generateTicketPdf({
                    eventTitle: event.title,
                    orderNumber,
                    startDate: event.startDate,
                    venueName: event.venue?.name,
                    venueCity: event.venue?.city,
                    ticketCount,
                    contactName: contactInfo ? contactInfo.firstName + ' ' + contactInfo.lastName : undefined,
                    contactEmail: contactInfo?.email,
                    contactPhone: contactInfo?.phone,
                    qrDataUrl,
                    qrFallbackText: orderNumber,
                  });

                  const pdfBlob = doc.output('blob');
                  const pdfFile = new File([pdfBlob], `ticket-${orderNumber}.pdf`, { type: 'application/pdf' });
                  if (navigator.share && navigator.canShare({ files: [pdfFile] })) {
                    await navigator.share({ title: `${event.title} - Ticket`, files: [pdfFile] });
                  } else {
                    downloadPdf(doc, `ticket-${orderNumber}.pdf`);
                    toast.success('PDF saved! Share it with your friends.');
                  }
                } catch {
                  const shareText = `🎫 ${event.title}\n\nOrder: ${orderNumber}\nDate: ${formatDate(event.startDate)}\nTime: ${formatTime(event.startDate)}\nVenue: ${event.venue?.name || 'TBA'}\nTickets: ${ticketCount}\n\nGet your tickets at EventFlow!`;
                  if (navigator.clipboard) { navigator.clipboard.writeText(shareText); toast.success('Ticket details copied to clipboard!'); }
                }
              }}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-900 border border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
          >
            <h3 className="text-lg mb-4 text-gray-900">What's Next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                  1
                </div>
                <div className="flex-1">
                  <div className="text-gray-900">Check your email</div>
                  <div className="text-sm text-gray-600">We've sent your tickets and booking confirmation</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                  2
                </div>
                <div className="flex-1">
                  <div className="text-gray-900">Add to calendar</div>
                  <div className="text-sm text-gray-600">Don't miss the event - add it to your calendar now</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                  3
                </div>
                <div className="flex-1">
                  <div className="text-gray-900">Arrive early</div>
                  <div className="text-sm text-gray-600">Gates open 30 minutes before the event starts</div>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Ticket className="w-5 h-5" />
              View My Tickets
            </Link>
            <div>
              <Link to="/events" className="text-indigo-600 hover:text-indigo-700">
                Browse more events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}