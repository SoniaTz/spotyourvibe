import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Ticket, User, Briefcase, ShieldQuestion } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'organizer',
    organizationName: '',
    phone: '',
    description: '',
    website: '',
    securityQuestion: '',
    securityAnswer: ''
  });

  const securityQuestions = [
    'What is your mother\'s maiden name?',
    'What was the name of your first pet?',
    'What city were you born in?',
    'What is the name of your favorite teacher?',
    'What was the make of your first car?'
  ];
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Country codes
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

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  const [selectedCountry, setSelectedCountry] = useState('+30');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const isValidPhone = (phone: string) => {
    if (!phone) return true;
    // Strip country code (first 2-4 digits after +) and check remaining digits
    const digits = phone.replace(/\D/g, '');
    // Country codes are 1-4 digits, so total digits = country code + 10 phone digits
    // We just check that there are at least 10 digits after the country code
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      setError('Please enter a valid phone number');
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setError('Password must be at least 8 characters with 1 uppercase letter, 1 lowercase letter, and 1 number');
      toast.error('Password is not strong enough');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData.name, formData.role, {
        organizationName: formData.organizationName,
        phone: formData.phone,
        description: formData.description,
        website: formData.website,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer
      });
      toast.success('Account created successfully!');
      
      if (formData.role === 'organizer') {
        toast.info('Your organizer application is pending admin approval. You can use the platform as a regular user in the meantime.');
        navigate('/events');
      } else {
        navigate('/events');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl text-gray-900">EventFlow</span>
        </Link>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl mb-2 text-gray-900">Create your account</h1>
            <p className="text-gray-600">Join EventFlow to start booking or hosting events</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-3">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'user' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.role === 'user'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className={`w-6 h-6 mx-auto mb-2 ${
                  formData.role === 'user' ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <div className={`text-sm ${
                  formData.role === 'user' ? 'text-indigo-600' : 'text-gray-700'
                }`}>
                  Attend Events
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'organizer' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.role === 'organizer'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Briefcase className={`w-6 h-6 mx-auto mb-2 ${
                  formData.role === 'organizer' ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <div className={`text-sm ${
                  formData.role === 'organizer' ? 'text-indigo-600' : 'text-gray-700'
                }`}>
                  Host Events
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${formData.email && isValidEmail(formData.email) ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {formData.email && isValidEmail(formData.email) ? (
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${formData.email ? 'bg-red-400' : 'bg-gray-400'}`} />
                  )}
                </div>
                <span className={formData.email ? (isValidEmail(formData.email) ? 'text-green-600' : 'text-red-500') : 'text-gray-400'}>
                  {formData.email ? (isValidEmail(formData.email) ? 'Valid email address' : 'Invalid email format') : 'Valid email address'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pl-11 pr-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Create a strong password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password requirements - horizontal layout */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                <div className={`flex items-center gap-1.5 text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                  {formData.password.length >= 8 ? (
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
                  )}
                  <span>8 chars</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/[A-Z]/.test(formData.password) ? (
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
                  )}
                  <span>Uppercase</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/[a-z]/.test(formData.password) ? (
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
                  )}
                  <span>Lowercase</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/\d/.test(formData.password) ? (
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
                  )}
                  <span>Number</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {formData.role === 'organizer' && (
              <>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Organization / Company Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Your organization or company name"
                      required={formData.role === 'organizer'}
                    />
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  <label className="block text-sm text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Tell us about your organization"
                    rows={3}
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Organizer accounts require admin verification before you can create events. You can use the platform as a regular user in the meantime.
                  </p>
                </div>
              </>
            )}

            {/* Security Question Section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <ShieldQuestion className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Security Question (for password recovery)</span>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Choose a Security Question</label>
                <select
                  value={formData.securityQuestion}
                  onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="">Select a question...</option>
                  {securityQuestions.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              {formData.securityQuestion && (
                <div className="mt-3">
                  <label className="block text-sm text-gray-700 mb-2">Your Answer</label>
                  <input
                    type="text"
                    value={formData.securityAnswer}
                    onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Enter your answer"
                  />
                  <p className="mt-1 text-xs text-gray-500">Remember this answer — you'll need it to reset your password.</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">← Back to home</Link>
        </div>
      </motion.div>
    </div>
  );
}