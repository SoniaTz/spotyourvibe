import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import Navigation from '../components/Navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Building2,
  Phone,
  Globe,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

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

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  verified: boolean;
  organizerApplication?: {
    id: string;
    organizationName: string;
    phone: string;
    description: string;
    website: string | null;
    documentFile: string | null;
    status: string;
    createdAt: string;
  } | null;
  _count?: {
    bookings: number;
    events: number;
  };
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editOrgName, setEditOrgName] = useState('');

  // Phone with country code
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
    setEditPhone(code + phoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    if (digits.length <= 10) {
      setPhoneNumber(digits);
      setEditPhone(selectedCountry + digits);
    }
  };
  const [editDescription, setEditDescription] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const isOrganizer = user?.role === 'organizer';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: ProfileData }>('/auth/profile');
      setProfile(res.data);
      // Populate edit fields
      setEditName(res.data.name);
      setEditEmail(res.data.email);
      const existingPhone = res.data.phone || '';
      setEditPhone(existingPhone);
      // Parse existing phone to extract country code and number
      if (existingPhone) {
        const match = existingPhone.match(/^(\+\d{1,4})(\d{6,15})$/);
        if (match) {
          const matchedCode = match[1];
          const matchedNumber = match[2];
          // Check if this country code exists in our list
          const found = countryCodes.find(c => c.code === matchedCode);
          if (found) {
            setSelectedCountry(matchedCode);
          }
          setPhoneNumber(matchedNumber);
        }
      }
      if (res.data.organizerApplication) {
        setEditOrgName(res.data.organizerApplication.organizationName || '');
        setEditDescription(res.data.organizerApplication.description || '');
        setEditWebsite(res.data.organizerApplication.website || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editName.trim()) {
      setError('Name is required');
      return;
    }
    if (!editEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setSaving(true);
      const body: Record<string, string> = {};

      // Only send changed fields
      if (editName.trim() !== profile?.name) body.name = editName.trim();
      if (editEmail.trim() !== profile?.email) body.email = editEmail.trim();
      if (editPhone.trim() !== (profile?.phone || '')) body.phone = editPhone.trim();

      if (isOrganizer || isAdmin) {
        const app = profile?.organizerApplication;
        if (app) {
          if (editOrgName.trim() !== (app.organizationName || '')) body.organizationName = editOrgName.trim();
          if (editDescription.trim() !== (app.description || '')) body.description = editDescription.trim();
          if (editWebsite.trim() !== (app.website || '')) body.website = editWebsite.trim();
        }
      }

      // If nothing changed, show a message
      if (Object.keys(body).length === 0) {
        setSuccess('No changes to save');
        setTimeout(() => setSuccess(''), 3000);
        setSaving(false);
        return;
      }

      const res = await apiRequest<{ success: boolean; data: ProfileData; message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      setProfile(res.data);
      updateUser({ name: res.data.name, email: res.data.email });
      setSuccess(res.message || 'Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const isStrongPassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setPasswordError('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setChangingPassword(true);
      await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setSuccess('');

    if (!deletePassword) {
      setError('Please enter your password to confirm deletion');
      return;
    }

    try {
      setDeletingAccount(true);
      await apiRequest('/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword })
      });
      // Logout and redirect
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 pt-24">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600">{error || 'Could not load profile'}</p>
            <button
              onClick={fetchProfile}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    REJECTED: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account information and settings</p>
        </motion.div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              &times;
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-white font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{profile.email}</p>

                <div className="mt-4 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full capitalize flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {profile.role.toLowerCase()}
                  </span>
                  {profile.role === 'ORGANIZER' && (
                    <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                      profile.verified
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {profile.verified ? (
                        <><CheckCircle2 className="w-3 h-3" /> Verified</>
                      ) : (
                        <><AlertCircle className="w-3 h-3" /> Pending</>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Member since {formatDate(profile.createdAt)}</span>
                </div>
                {profile._count && (
                  <>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{profile._count.bookings} booking(s)</span>
                    </div>
                    {profile.role === 'ORGANIZER' && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{profile._count.events} event(s)</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Organizer Application Status */}
              {profile.organizerApplication && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Application Status
                  </h3>
                  <div className={`px-3 py-2 rounded-lg text-xs font-medium inline-block ${
                    statusColors[profile.organizerApplication.status] || 'bg-gray-100 text-gray-700'
                  }`}>
                    {profile.organizerApplication.status}
                  </div>
                  {profile.organizerApplication.status === 'PENDING' && (
                    <p className="mt-2 text-xs text-gray-500">
                      Your organizer application is being reviewed by the admin team.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Edit Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  <p className="text-sm text-gray-500">Update your personal details</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Phone number for all users */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Dropdown */}
                    <div className="relative w-28 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="w-full flex items-center justify-between gap-1 px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <span>{getFlagEmoji(countryCodes.find(c => c.code === selectedCountry)?.country || 'GR')}</span>
                        <span className="text-gray-700">{selectedCountry}</span>
                        <svg className={`w-3 h-3 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
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
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="6900000000"
                        maxLength={10}
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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

                {(isOrganizer || isAdmin) && profile.organizerApplication && (
                  <div className="pt-4 border-t border-gray-200 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Organization Details
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={editOrgName}
                          onChange={(e) => setEditOrgName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Organization name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={3}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                          placeholder="Description about your organization"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={editWebsite}
                          onChange={(e) => setEditWebsite(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="https://your-website.com"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Password Change */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Lock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </div>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                  <button onClick={() => setPasswordError('')} className="ml-auto text-red-400 hover:text-red-600">&times;</button>
                </div>
              )}
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Enter new password (min 8 chars)"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                    <div className={`flex items-center gap-1.5 text-xs ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                      {newPassword.length >= 8 ? (
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
                      )}
                      <span>8 chars</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      {/[A-Z]/.test(newPassword) ? (
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
                      )}
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      {/[a-z]/.test(newPassword) ? (
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
                      )}
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      {/\d/.test(newPassword) ? (
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
                      )}
                      <span>Number</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPasswords"
                    checked={showPasswords}
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="showPasswords" className="text-sm text-gray-600 flex items-center gap-1">
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Show passwords
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Change Password
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Delete Account */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-red-200 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
                  <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <AlertCircle className="w-4 h-4" />
                  Delete My Account
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700 font-medium mb-2">⚠️ This action cannot be undone</p>
                    <p className="text-xs text-red-600">
                      All your bookings, notifications, and account data will be permanently deleted.
                      {isOrganizer && ' Your events will also be removed.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter your password to confirm
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword('');
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount || !deletePassword}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {deletingAccount ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Permanently Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}