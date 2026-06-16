import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { ArrowLeft, Check, Ticket, Minus, Plus, Loader2, Clock } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { toast } from 'sonner';
import { formatTicketId } from '../lib/utils';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { event, selectedSeats } = location.state || {};

  const hasAssignedSeats = selectedSeats && selectedSeats.length > 0;

  const [quantity, setQuantity] = useState(
    hasAssignedSeats ? selectedSeats.length : 1
  );

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const [processing, setProcessing] = useState(false);

  // 10-minute countdown timer
  const TOTAL_TIME = 10 * 60; // 10 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          toast.error('Your reservation time has expired. Please go back and try again.');
          navigate(`/events/${event?.id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [event?.id, navigate]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all contact information fields');
      return;
    }

    setProcessing(true);

    try {
      const seatsReserved = hasAssignedSeats ? selectedSeats.length : quantity;

      const bookingPayload: Record<string, any> = {
        eventId: event.id,
        seatsReserved,
        contactName: `${formData.firstName} ${formData.lastName}`,
        contactEmail: formData.email,
        contactPhone: formData.phone
      };

      // Include seat labels for assigned seating
      if (hasAssignedSeats && selectedSeats.length > 0) {
        bookingPayload.seatLabels = selectedSeats.map((s: any) => `${s.row}${s.number}`);
      }

      const res = await apiRequest<{ success: boolean; data: any }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingPayload)
      });

      if (res.success) {
        if (timerRef.current) clearInterval(timerRef.current);
        toast.success('Booking created successfully!');
        navigate('/confirmation', {
          state: {
            event,
            selectedSeats: hasAssignedSeats ? selectedSeats : [],
            booking: res.data,
            orderNumber: formatTicketId(res.data.id),
            contactInfo: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone
            }
          }
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setProcessing(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4 text-gray-900">No booking found</h2>
          <Link to="/events" className="text-indigo-600 hover:text-indigo-700">
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  const seatsToDisplay = selectedSeats || [];
  const seatCount = hasAssignedSeats ? selectedSeats.length : quantity;
  const isUrgent = timeLeft <= 120; // Last 2 minutes

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link to={`/events/${event.id}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to event
            </Link>
            <h1 className="text-3xl text-gray-900">Complete Your Booking</h1>
            <p className="text-gray-600 mt-2">Reserve your tickets for {event.title}</p>
          </div>

          {/* Countdown Timer */}
          <div className={`mb-6 rounded-xl p-4 flex items-center justify-center gap-3 ${
            isUrgent
              ? 'bg-red-50 border-2 border-red-300'
              : 'bg-amber-50 border-2 border-amber-300'
          }`}>
            <Clock className={`w-5 h-5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
            <span className={`text-sm font-medium ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
              Your tickets are reserved for
            </span>
            <span className={`text-2xl font-bold font-mono ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
              {formatTimer(timeLeft)}
            </span>
            <span className={`text-sm ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}>
              minutes
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Quantity (General Admission only) */}
              {!hasAssignedSeats && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      1
                    </div>
                    <h2 className="text-xl text-gray-900">Select Number of Tickets</h2>
                  </div>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                      <span className="text-5xl font-bold text-gray-900">{quantity}</span>
                      <div className="text-sm text-gray-600 mt-1">
                        ticket{quantity !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-4">Maximum 10 tickets per order</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    {hasAssignedSeats ? '1' : '2'}
                  </div>
                  <h2 className="text-xl text-gray-900">Contact Information</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reserve Button */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full px-6 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Reserving Your Tickets...
                      </>
                    ) : (
                      <>
                        <Ticket className="w-5 h-5" />
                        Reserve {seatCount} Ticket{seatCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-600 text-center">
                    No payment required. Your tickets will be reserved instantly.
                  </p>
                </form>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg text-gray-900">Order Summary</h2>
                </div>

                <div className="p-6 space-y-4">
                  {/* Event Info */}
                  <div>
                    <h3 className="text-gray-900 font-medium mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.date}</p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>

                  {/* Tickets */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Tickets</h4>
                      <span className="text-sm text-gray-900 font-medium">{seatCount}x</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {seatsToDisplay.length > 0 ? (
                        seatsToDisplay.map((seat: any) => (
                          <div key={seat.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{seat.row}{seat.number}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-700">
                          {quantity} general admission ticket{quantity !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Instant ticket delivery</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Mobile entry accepted</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Free cancellation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}