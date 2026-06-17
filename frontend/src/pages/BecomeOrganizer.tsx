import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Globe, FileText, Upload, ArrowLeft, Ticket, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getAuthHeaders } from '../lib/api';

const countryCodes = [
  { code: '+30', country: 'GR' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'GB' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+39', country: 'IT' },
  { code: '+34', country: 'ES' },
  { code: '+31', country: 'NL' },
  { code: '+46', country: 'SE' },
  { code: '+47', country: 'NO' },
  { code: '+45', country: 'DK' },
  { code: '+358', country: 'FI' },
  { code: '+48', country: 'PL' },
  { code: '+420', country: 'CZ' },
  { code: '+43', country: 'AT' },
  { code: '+41', country: 'CH' },
  { code: '+32', country: 'BE' },
  { code: '+351', country: 'PT' },
  { code: '+353', country: 'IE' },
  { code: '+40', country: 'RO' },
  { code: '+36', country: 'HU' },
  { code: '+7', country: 'RU' },
  { code: '+90', country: 'TR' },
  { code: '+972', country: 'IL' },
  { code: '+971', country: 'AE' },
  { code: '+966', country: 'SA' },
  { code: '+20', country: 'EG' },
  { code: '+27', country: 'ZA' },
  { code: '+52', country: 'MX' },
  { code: '+55', country: 'BR' },
  { code: '+54', country: 'AR' },
  { code: '+56', country: 'CL' },
  { code: '+57', country: 'CO' },
  { code: '+61', country: 'AU' },
  { code: '+64', country: 'NZ' },
  { code: '+82', country: 'KR' },
  { code: '+81', country: 'JP' },
  { code: '+86', country: 'CN' },
  { code: '+91', country: 'IN' },
  { code: '+66', country: 'TH' },
  { code: '+63', country: 'PH' },
  { code: '+62', country: 'ID' },
  { code: '+60', country: 'MY' },
  { code: '+65', country: 'SG' },
];

export default function BecomeOrganizer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    organizationName: '',
    phone: '',
    description: '',
    website: '',
  });

  const [selectedCountry, setSelectedCountry] = useState('+30');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const isValidPhone = (phone: string) => {
    if (!phone) return true;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code);
    setShowCountryDropdown(false);
    setFormData({ ...formData, phone: code + phoneNumber });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    if (digits.length <= 10) {
      setPhoneNumber(digits);
      setFormData({ ...formData, phone: selectedCountry + digits });
    }
  };
  const [document, setDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const authHeaders = getAuthHeaders();
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/organizer/my-application`, {
          headers: { ...(authHeaders as Record<string, string>) },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setExistingApplication(data.data);
          }
        }
      } catch { /* no application */ }
      finally { setCheckingApplication(false); }
    };
    if (user) checkExisting();
  }, [user]);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationName.trim()) {
      toast.error('Organization name is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('organizationName', formData.organizationName);
      submitData.append('phone', formData.phone);
      submitData.append('description', formData.description);
      submitData.append('website', formData.website);
      if (document) {
        submitData.append('document', document);
      }

      const authHeaders = getAuthHeaders();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/organizer/apply`, {
        method: 'POST',
        headers: {
          ...(authHeaders as Record<string, string>),
        },
        body: submitData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((e: any) => e.message).join('. ');
          throw new Error(errorMessages || data.message);
        }
        throw new Error(data.message || 'Failed to submit application');
      }

      setSubmitted(true);
      toast.success('Application submitted successfully! Admin will review it shortly.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your organizer application has been submitted. An admin will review it shortly.
            You'll receive a notification once your application is approved.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EventFlow</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Become an Organizer</h1>
            <p className="text-gray-600">
              Create and manage events on EventFlow. Submit your application and get approved by our team.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {checkingApplication ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : existingApplication && existingApplication.status !== 'REJECTED' ? (
              <div className="text-center py-8">
                <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${existingApplication.status === 'APPROVED' ? 'text-green-500' : 'text-yellow-500'}`} />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {existingApplication.status === 'APPROVED' ? 'Application Approved!' :
                   'Application Under Review'}
                </h2>
                <p className="text-gray-600 mb-2">
                  {existingApplication.status === 'APPROVED' 
                    ? 'Your organizer application has been approved. You can now create events!'
                    : 'Your application is being reviewed by our team. You will be notified once a decision is made.'}
                </p>
                <div className="mt-6 space-y-2 text-sm text-left max-w-sm mx-auto">
                  <div className="flex justify-between bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-gray-500">Organization</span>
                    <span className="font-medium text-gray-900">{existingApplication.organizationName}</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${existingApplication.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {existingApplication.status}
                    </span>
                  </div>
                  <div className="flex justify-between bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-gray-500">Submitted</span>
                    <span className="font-medium text-gray-900">
                      {new Date(existingApplication.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization / Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="e.g., Premier Events Co."
                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Phone (optional)</label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="relative w-28 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full flex items-center justify-between gap-1 px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    >
                      <span>{getFlagEmoji(countryCodes.find(c => c.code === selectedCountry)?.country || 'GR')}</span>
                      <span className="text-gray-700">{selectedCountry}</span>
                      <svg className={`w-3 h-3 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {countryCodes.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleCountrySelect(c.code)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${selectedCountry === c.code ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}`}
                          >
                            <span>{getFlagEmoji(c.country)}</span>
                            <span>{c.code}</span>
                            <span className="text-gray-400 text-xs">{c.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      placeholder="6900000000"
                      maxLength={10}
                    />
                  </div>
                </div>
                {phoneNumber.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${phoneNumber.length === 10 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {phoneNumber.length === 10 ? (
                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </div>
                    <span className={phoneNumber.length === 10 ? 'text-green-600' : 'text-red-500'}>
                      {phoneNumber.length < 10 ? `Enter ${10 - phoneNumber.length} more digit${10 - phoneNumber.length === 1 ? '' : 's'}` : 'Valid phone number'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us about your organization and the events you plan to host..."
                    rows={4}
                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Document (Optional)
                </label>
                <div className="relative">
                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {document ? document.name : 'Upload business license or registration'}
                    </span>
                    <input
                      type="file"
                      onChange={e => setDocument(e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG, or DOC (max 5MB)</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Applications are typically reviewed within 24 hours.
              <br />You'll be notified once approved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}