import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { ArrowLeft, Upload, Plus, X, Calendar, MapPin, Users, Clock, Info, AlertCircle, Loader2 } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiRequest, API_BASE_URL } from '../lib/api';

interface EventData {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  importantInfo?: string;
  lineup?: string;
  seatingType?: string;
  maxTicketsPerOrder?: number;
  image?: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  availableSeats: number;
  status: string;
  category?: { id: string; name: string };
  venue?: { id: string; name: string; address: string; city: string };
}

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);

  // State for API data
  const [categoriesData, setCategoriesData] = useState<{id: string, name: string}[]>([]);
  const [venuesData, setVenuesData] = useState<{id: string, name: string, address: string, city: string}[]>([]);

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

  // Fetch categories and venues on mount
  useEffect(() => {
    const fetchData = async () => {
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
      }
    };
    fetchData();
  }, []);

  // Fetch event data on mount
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const res = await apiRequest<{ success: boolean; data: EventData }>(`/events/${id}`);
        if (res.success && res.data) {
          const event = res.data;
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);

          setFormData({
            title: event.title,
            subtitle: event.shortDescription || '',
            category: event.category?.name || '',
            description: event.fullDescription || '',
            date: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().slice(0, 5),
            endTime: endDate.toTimeString().slice(0, 5),
            venue: event.venue?.name || '',
            address: event.venue?.address || '',
            city: event.venue?.city || '',
            state: '',
            zip: '',
            capacity: String(event.maxCapacity),
            maxTicketsPerOrder: String(event.maxTicketsPerOrder || 10),
            imageUrl: event.image || ''
          });

          // Parse importantInfo
          if (event.importantInfo) {
            try {
              const parsed = JSON.parse(event.importantInfo);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setImportantInfoItems(parsed);
              }
            } catch {
              setImportantInfoItems([event.importantInfo]);
            }
          }

          // Parse lineup
          if (event.lineup) {
            try {
              const parsed = JSON.parse(event.lineup);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setLineupItems(parsed);
              }
            } catch {
              setLineupItems([event.lineup]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
        toast.error('Failed to load event');
        navigate('/organizer/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a temporary preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageUrl: previewUrl }));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    const { title, category, description, date, startTime, capacity, venue, address, city } = formData;

    // Validate required fields
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
    if (!capacity?.trim()) {
      toast.error('Please enter event capacity');
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

    setSaving(true);
    try {
      // Find or create venue
      let venueId = '';
      const existingVenue = venuesData.find(v =>
        v.name.toLowerCase() === formData.venue.toLowerCase()
      );

      if (existingVenue) {
        venueId = existingVenue.id;
        // If venue exists but city or address changed, update the venue record
        const venueChanged =
          existingVenue.city !== formData.city ||
          existingVenue.address !== formData.address;
        
        if (venueChanged) {
          try {
            await apiRequest(`/organizer/venues/${existingVenue.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                name: formData.venue,
                address: formData.address,
                city: formData.city
              })
            });
            // Update local cache
            setVenuesData(prev => prev.map(v =>
              v.id === existingVenue.id
                ? { ...v, name: formData.venue, address: formData.address, city: formData.city }
                : v
            ));
          } catch (updateErr) {
            console.error('Failed to update venue details:', updateErr);
            // Continue anyway - venue ID is still valid
          }
        }
      } else {
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
      const categoryObj = categoriesData.find(c =>
        c.name.toLowerCase() === formData.category.toLowerCase()
      );
      let categoryId = categoryObj?.id || '';

      if (!categoryId) {
        const catRes = await apiRequest<{success: boolean, data: {id: string}}>('/organizer/categories', {
          method: 'POST',
          body: JSON.stringify({ name: formData.category })
        });
        if (!catRes.success || !catRes.data) {
          throw new Error('Failed to create category');
        }
        categoryId = catRes.data.id;
      }

      const startDate = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      const endDate = formData.endTime
        ? new Date(`${formData.date}T${formData.endTime}:00`).toISOString()
        : new Date(`${formData.date}T${formData.startTime}:00`).toISOString();

      // Filter out empty important info items
      const filteredImportantInfo = importantInfoItems.filter(item => item.trim() !== '');
      const filteredLineup = lineupItems.filter(item => item.trim() !== '');

      // Build form data for the event update
      // If there's a file, use FormData; otherwise use JSON
      let eventData: any;
      let requestOptions: any;

      if (imageFile) {
        // Use FormData for file upload
        const form = new FormData();
        form.append('image', imageFile);
        form.append('title', formData.title);
        form.append('shortDescription', formData.subtitle || formData.description.substring(0, 100));
        form.append('fullDescription', formData.description);
        form.append('startDate', startDate);
        form.append('endDate', endDate);
        form.append('maxCapacity', String(parseInt(formData.capacity)));
        form.append('maxTicketsPerOrder', String(parseInt(formData.maxTicketsPerOrder) || 10));
        form.append('venueId', venueId);
        form.append('categoryId', categoryId);
        form.append('importantInfo', filteredImportantInfo.length > 0 ? JSON.stringify(filteredImportantInfo) : '');
        form.append('lineup', filteredLineup.length > 0 ? JSON.stringify(filteredLineup) : '');
        requestOptions = { method: 'PUT', body: form };
      } else {
        // Use JSON for URL-based image
        eventData = {
          title: formData.title,
          shortDescription: formData.subtitle || formData.description.substring(0, 100),
          fullDescription: formData.description,
          startDate,
          endDate,
          maxCapacity: parseInt(formData.capacity),
          maxTicketsPerOrder: parseInt(formData.maxTicketsPerOrder) || 10,
          venueId,
          categoryId,
          importantInfo: filteredImportantInfo.length > 0 ? JSON.stringify(filteredImportantInfo) : null,
          lineup: filteredLineup.length > 0 ? JSON.stringify(filteredLineup) : null,
          image: formData.imageUrl || null
        };
        requestOptions = { method: 'PUT', body: JSON.stringify(eventData) };
      }

      const res = await apiRequest<{ success: boolean; message: string }>(`/events/${id}`, requestOptions);

      if (res.success) {
        toast.success('Event updated successfully! It will be reviewed again by admin.');
        navigate('/organizer/dashboard');
      } else {
        throw new Error(res.message || 'Failed to update event');
      }
    } catch (err: any) {
      console.error('Failed to update event:', err);
      toast.error(err.message || 'Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Determine display image
  const displayImageUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : formData.imageUrl
      ? formData.imageUrl.startsWith('http') || formData.imageUrl.startsWith('blob:')
        ? formData.imageUrl
        : API_BASE_URL?.replace('/api', '') + formData.imageUrl
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/organizer/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            <h1 className="text-4xl mb-2 text-gray-900">Edit Event</h1>
            <p className="text-gray-600">Update your event details</p>
          </div>

          {/* Notice Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-amber-900 mb-1">Event Will Be Re-reviewed</div>
                <p className="text-sm text-amber-800">
                  After making changes, your event will be submitted for admin review again before it's republished.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
            {/* Title */}
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

            {/* Subtitle */}
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

            {/* Category */}
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

            {/* Description */}
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

            {/* Image */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Event Image</label>

              {/* Image preview */}
              {displayImageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={displayImageUrl}
                    alt="Event preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  name="imageUrl"
                  value={imageFile ? '' : formData.imageUrl}
                  onChange={handleInputChange}
                  onFocus={() => { if (imageFile) setImageFile(null); }}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {imageFile ? 'Change File' : 'Upload'}
                </button>
              </div>
              {imageFile && (
                <p className="text-xs text-green-600 mt-1">File selected: {imageFile.name}</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Event Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Start Time *</label>
                <div className="relative">
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* End Time (optional) */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">End Time (optional)</label>
              <div className="relative">
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Important Information */}
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

            {/* Event Lineup */}
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

            {/* Venue */}
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

            {/* Location Picker */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Location on Map</label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialAddress={formData.address}
                initialCity={formData.city}
                initialState={formData.state}
                initialZip={formData.zip}
              />
            </div>

            {/* Address */}
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

            {/* City, State, Zip */}
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

            {/* Capacity */}
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

            {/* Max Tickets Per Order */}
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

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Link
                to="/organizer/dashboard"
                className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}