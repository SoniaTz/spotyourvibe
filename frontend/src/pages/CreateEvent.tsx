import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { ArrowLeft, Upload, Plus, X, Calendar, MapPin, Users, Clock, Info, AlertCircle, Loader2 } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiRequest } from '../lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    capacity: '',
    maxTicketsPerOrder: '10',
    imageUrl: ''
  });

const [importantInfoItems, setImportantInfoItems] = useState<string[]>(['']);
  const [lineupItems, setLineupItems] = useState<string[]>(['']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ticketTiers, setTicketTiers] = useState([
    { name: 'General Admission', quantity: '', description: '' }
  ]);

  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [seatingType, setSeatingType] = useState<'general' | 'assigned'>('general');
  const [seatRows, setSeatRows] = useState('');
  const [seatColumns, setSeatColumns] = useState('');

  // Helper to format 24h time string for display based on selected format
  const formatTimeForDisplay = (time24: string): string => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    if (timeFormat === '24h') {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const categories = [
    'Music',
    'Conference',
    'Sports',
    'Entertainment',
    'Arts',
    'Food & Drink',
    'Festival',
    'Workshop',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (data: { address: string; city: string; state: string; zip: string; lat: number; lng: number; placeName?: string }) => {
    setFormData(prev => ({
      ...prev,
      address: data.address || prev.address,
      city: data.city || prev.city,
      state: data.state || prev.state,
      zip: data.zip || prev.zip,
      venue: data.placeName || prev.venue,
    }));
    setMapLocation({ lat: data.lat, lng: data.lng });
  };

  const handleTicketChange = (index: number, field: string, value: string) => {
    const newTiers = [...ticketTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTicketTiers(newTiers);
  };

const addTicketTier = () => {
    setTicketTiers([...ticketTiers, { name: '', quantity: '', description: '' }]);
  };

  const removeTicketTier = (index: number) => {
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const handleImportantInfoChange = (index: number, value: string) => {
    const newItems = [...importantInfoItems];
    newItems[index] = value;
    setImportantInfoItems(newItems);
  };

  const addImportantInfoItem = () => {
    setImportantInfoItems([...importantInfoItems, '']);
  };

const removeImportantInfoItem = (index: number) => {
    setImportantInfoItems(importantInfoItems.filter((_, i) => i !== index));
  };

  const handleLineupChange = (index: number, value: string) => {
    const newItems = [...lineupItems];
    newItems[index] = value;
    setLineupItems(newItems);
  };

  const addLineupItem = () => {
    setLineupItems([...lineupItems, '']);
  };

  const removeLineupItem = (index: number) => {
    setLineupItems(lineupItems.filter((_, i) => i !== index));
  };

  // State for API data
  const [categoriesData, setCategoriesData] = useState<{id: string, name: string}[]>([]);
  const [venuesData, setVenuesData] = useState<{id: string, name: string, address: string, city: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData(prev => ({ ...prev, imageUrl: previewUrl }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch categories and venues on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoriesRes, venuesRes] = await Promise.all([
          apiRequest<{success: boolean, data: {id: string, name: string}[]}>('/public/categories'),
          apiRequest<{success: boolean, data: {id: string, name: string, address: string, city: string}[]}>('/public/venues')
        ]);
        if (categoriesRes.success && categoriesRes.data) {
          setCategoriesData(categoriesRes.data);
        }
        if (venuesRes.success && venuesRes.data) {
          setVenuesData(venuesRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories/venues:', err);
        toast.error('Failed to load form data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

const handleSubmit = async () => {
    // Validate required fields - use optional chaining for safety
    const { title, category, description, date, startTime, capacity, venue, address, city, state, zip } = formData;
    
    if (!title?.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!category?.trim()) {
      toast.error('Please select a category');
      return;
    }
    if (!description?.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!date?.trim()) {
      toast.error('Please select an event date');
      return;
    }
    if (!startTime?.trim()) {
      toast.error('Please select a start time');
      return;
    }
    if (seatingType === 'general' && !capacity?.trim()) {
      toast.error('Please enter event capacity');
      return;
    }
    if (seatingType === 'assigned' && (!seatRows || !seatColumns)) {
      toast.error('Please enter the number of rows and columns for the seat map');
      return;
    }
    if (!venue?.trim()) {
      toast.error('Please enter a venue name');
      return;
    }
    if (!address?.trim()) {
      toast.error('Please enter an address');
      return;
    }
    if (!city?.trim()) {
      toast.error('Please enter a city');
      return;
    }
    if (!state?.trim()) {
      toast.error('Please enter a state');
      return;
    }
    if (!zip?.trim()) {
      toast.error('Please enter a ZIP code');
      return;
    }

    setSubmitting(true);
    try {
      // Find or create venue
      let venueId = '';
      const existingVenue = venuesData.find(v => 
        v.name.toLowerCase() === formData.venue.toLowerCase()
      );
      
      if (existingVenue) {
        venueId = existingVenue.id;
} else {
        // Create new venue using organizer route
        const venueRes = await apiRequest<{success: boolean, data: {id: string}}>('/organizer/venues', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.venue,
            address: formData.address,
            city: formData.city,
            capacity: parseInt(formData.capacity) || 100
          })
        });
        if (venueRes.success && venueRes.data) {
          venueId = venueRes.data.id;
          // Add to local venues list
          setVenuesData(prev => [...prev, {
            id: venueId,
            name: formData.venue,
            address: formData.address,
            city: formData.city
          }]);
        }
      }

      if (!venueId) {
        throw new Error('Failed to create or find venue');
      }

      // Find or create category
      let category = categoriesData.find(c => 
        c.name.toLowerCase() === formData.category.toLowerCase()
      );
      
if (!category) {
        // Create category if not found using organizer route
        const catRes = await apiRequest<{success: boolean, data: {id: string}}>('/organizer/categories', {
          method: 'POST',
          body: JSON.stringify({ name: formData.category })
        });
        if (!catRes.success || !catRes.data) {
          throw new Error('Failed to create category');
        }
        category = { id: catRes.data.id, name: formData.category };
      }

      // Format dates
      const startDate = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      const endDate = startDate;

// Create event data - filter out empty important info items
      const filteredImportantInfo = importantInfoItems.filter(item => item.trim() !== '');
      const filteredLineup = lineupItems.filter(item => item.trim() !== '');
      
      // Build form data for submission (to support file upload)
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('shortDescription', formData.subtitle || formData.description.substring(0, 100));
      submitData.append('fullDescription', formData.description);
      submitData.append('startDate', startDate);
      submitData.append('endDate', endDate);
      submitData.append('maxCapacity', formData.capacity);
      submitData.append('maxTicketsPerOrder', formData.maxTicketsPerOrder || '10');
      submitData.append('seatingType', seatingType);
      if (seatingType === 'assigned') {
        submitData.append('seatRows', seatRows);
        submitData.append('seatColumns', seatColumns);
      }
      submitData.append('venueId', venueId);
      submitData.append('categoryId', category.id);
      if (filteredImportantInfo.length > 0) {
        submitData.append('importantInfo', JSON.stringify(filteredImportantInfo));
      }
      if (filteredLineup.length > 0) {
        submitData.append('lineup', JSON.stringify(filteredLineup));
      }
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.imageUrl && !imagePreview) {
        submitData.append('image', formData.imageUrl);
      }

      // Submit to API
      const res = await apiRequest<{success: boolean, message: string}>('/events', {
        method: 'POST',
        body: submitData
      });

      if (res.success) {
        toast.success('Event submitted for admin review!');
        navigate('/organizer/dashboard');
      } else {
        throw new Error(res.message || 'Failed to create event');
      }
    } catch (err: any) {
      console.error('Failed to create event:', err);
      toast.error(err.message || 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Event details' },
    { number: 2, title: 'Location', description: 'Where it happens' },
    { number: 3, title: 'Tickets', description: 'Tiers & capacity' },
    { number: 4, title: 'Review', description: 'Finalize & publish' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Verification Notice Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-amber-900 mb-1">Event Approval Required</div>
                <p className="text-sm text-amber-800">
                  Your event will be submitted for admin review and will be published to the platform after verification. You'll be notified once it's approved.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Header */}
          <div className="mb-8">
            <Link to="/organizer/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            <h1 className="text-4xl mb-2 text-gray-900">Create New Event</h1>
            <p className="text-gray-600">Fill in the details to create your event</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      currentStep >= step.number
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-300 text-gray-600'
                    }`}>
                      {step.number}
                    </div>
                    <div className="text-center mt-2 hidden sm:block">
                      <div className={`text-sm ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-600'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Summer Music Festival 2026"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="Brief tagline for your event"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Describe your event, what attendees can expect, and what makes it special..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Event Image</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                  {imagePreview && (
                    <div className="mt-4 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-48 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Time Format Toggle */}
                <div className="flex items-center gap-3 mb-2">
                  <label className="block text-sm text-gray-700">Time Format</label>
                  <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-300">
                    <button
                      type="button"
                      onClick={() => setTimeFormat('12h')}
                      className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                        timeFormat === '12h'
                          ? 'bg-white text-indigo-600 shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      AM / PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeFormat('24h')}
                      className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                        timeFormat === '24h'
                          ? 'bg-white text-indigo-600 shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Military (24h)
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-700 mb-2">Event Date *</label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.date ? new Date(formData.date) : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            setFormData(prev => ({ ...prev, date: `${yyyy}-${mm}-${dd}` }));
                          }
                        }}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select date"
                        locale="en"
                        className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Start Time *</label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.startTime ? (() => {
                          const [h, m] = formData.startTime.split(':').map(Number);
                          const d = new Date();
                          d.setHours(h, m, 0, 0);
                          return d;
                        })() : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            const hh = String(date.getHours()).padStart(2, '0');
                            const mm = String(date.getMinutes()).padStart(2, '0');
                            setFormData(prev => ({ ...prev, startTime: `${hh}:${mm}` }));
                          }
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeFormat={timeFormat === '24h' ? 'HH:mm' : 'hh:mm aa'}
                        timeIntervals={15}
                        dateFormat={timeFormat === '24h' ? 'HH:mm' : 'hh:mm aa'}
                        placeholderText="Select start time"
                        locale="en"
                        className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-gray-900">Important Information</h3>
                    <button
                      type="button"
                      onClick={addImportantInfoItem}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Info
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Add bullet points that attendees should know about your event (e.g., "Doors open at 5:30 PM", "Age restriction: 18+")</p>

<div className="space-y-3">
                    {importantInfoItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleImportantInfoChange(index, e.target.value)}
                          placeholder="e.g., Doors open at 5:30 PM"
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {importantInfoItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImportantInfoItem(index)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-gray-900">Event Lineup</h3>
                    <button
                      type="button"
                      onClick={addLineupItem}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Artist
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Add performers, speakers, or special guests (e.g., "The Midnight Dreams - Headliner", "John Smith - Keynote Speaker")</p>

                  <div className="space-y-3">
                    {lineupItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleLineupChange(index, e.target.value)}
                          placeholder="e.g., Artist Name - Performer Type"
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {lineupItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineupItem(index)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Google Maps Location Picker */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      Search Location on Google Maps
                    </span>
                  </label>
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialAddress={formData.address}
                    initialCity={formData.city}
                    initialState={formData.state}
                    initialZip={formData.zip}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">or enter manually</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Venue Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                      placeholder="e.g., Madison Square Garden"
                      className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="10001"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="mb-1">Pro Tip</p>
                      <p className="text-blue-700">Use the Google Maps search above to quickly auto-fill your address, or enter it manually below.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

{/* Step 3: Tickets */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Seating Type Selection */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Seating Type *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSeatingType('general')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        seatingType === 'general'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Users className={`w-5 h-5 ${seatingType === 'general' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${seatingType === 'general' ? 'text-indigo-700' : 'text-gray-700'}`}>General Admission</span>
                      </div>
                      <p className="text-xs text-gray-500">Users get a ticket number. No specific seat assignment.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeatingType('assigned')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        seatingType === 'assigned'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className={`w-5 h-5 ${seatingType === 'assigned' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${seatingType === 'assigned' ? 'text-indigo-700' : 'text-gray-700'}`}>Assigned Seats</span>
                      </div>
                      <p className="text-xs text-gray-500">Users pick specific seats from a seat map with rows and columns.</p>
                    </button>
                  </div>
                </div>

                {/* Seat Map Configuration (only for assigned seating) */}
                {seatingType === 'assigned' && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Seat Map Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Number of Rows *</label>
                        <input
                          type="number"
                          value={seatRows}
                          onChange={(e) => setSeatRows(e.target.value)}
                          placeholder="e.g., 10"
                          min="1"
                          max="26"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Rows labeled A, B, C... (max 26)</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Seats per Row *</label>
                        <input
                          type="number"
                          value={seatColumns}
                          onChange={(e) => setSeatColumns(e.target.value)}
                          placeholder="e.g., 20"
                          min="1"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of seats in each row</p>
                      </div>
                    </div>
                    {seatRows && seatColumns && (
                      <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-100 px-3 py-2 rounded-lg">
                        <Info className="w-4 h-4" />
                        <span>Total capacity: <strong>{parseInt(seatRows) * parseInt(seatColumns)}</strong> seats ({seatRows} rows × {seatColumns} seats)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Capacity (only for general admission) */}
                {seatingType === 'general' && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Total Event Capacity *</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        placeholder="5000"
                        className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Max Tickets Per Order</label>
                  <input
                    type="number"
                    name="maxTicketsPerOrder"
                    value={formData.maxTicketsPerOrder}
                    onChange={handleInputChange}
                    placeholder="10"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of tickets a single user can purchase</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-gray-900">Ticket Tiers</h3>
                    <button
                      onClick={addTicketTier}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Tier
                    </button>
                  </div>

                  <div className="space-y-4">
                    {ticketTiers.map((tier, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-sm text-gray-700">Tier {index + 1}</div>
                          {ticketTiers.length > 1 && (
                            <button
                              onClick={() => removeTicketTier(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Ticket Name</label>
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                              placeholder="e.g., VIP Access"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs text-gray-600 mb-1">Quantity Available</label>
                          <input
                            type="number"
                            value={tier.quantity}
                            onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)}
                            placeholder="500"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Description (optional)</label>
                          <textarea
                            value={tier.description}
                            onChange={(e) => handleTicketChange(index, 'description', e.target.value)}
                            placeholder="What's included in this ticket tier..."
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl mb-2 text-gray-900">Review Your Event</h2>
                  <p className="text-gray-600">Make sure everything looks good before publishing</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Event Title</div>
                    <div className="text-gray-900">{formData.title || 'Not set'}</div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Category</div>
                    <div className="text-gray-900">{formData.category || 'Not set'}</div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Date & Time</div>
                    <div className="text-gray-900">
                      {formData.date ? new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'} 
                      {formData.startTime && ` at ${formatTimeForDisplay(formData.startTime)}`}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Location</div>
                    <div className="text-gray-900">
                      {formData.venue || 'Not set'}
                      {formData.address && <><br />{formData.address}</>}
                      {formData.city && formData.state && <><br />{formData.city}, {formData.state} {formData.zip}</>}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Ticket Tiers ({ticketTiers.length})</div>
                    {ticketTiers.map((tier, index) => (
                      <div key={index} className="text-gray-900 mb-1">
                        {tier.name || `Tier ${index + 1}`} ({tier.quantity} available)
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Seating Type</div>
                    <div className="text-gray-900 capitalize">{seatingType === 'assigned' ? 'Assigned Seats' : 'General Admission'}</div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Capacity</div>
                    <div className="text-gray-900">
                      {seatingType === 'assigned' && seatRows && seatColumns
                        ? `${parseInt(seatRows) * parseInt(seatColumns)} seats (${seatRows} rows × ${seatColumns} seats)`
                        : `${formData.capacity || 'Not set'} attendees`
                      }
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Event Image</div>
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-48 h-32 object-cover rounded-lg mt-2"
                      />
                    </div>
                  )}
                </div>

<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="mb-1">Ready to submit?</p>
                      <p className="text-amber-700">Your event will be submitted for admin review. Once approved, it will be visible to all users.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Continue
                </button>
) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Review'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}