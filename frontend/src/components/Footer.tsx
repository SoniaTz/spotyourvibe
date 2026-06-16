import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Ticket } from 'lucide-react';
import { apiRequest } from '../lib/api';

export default function Footer() {
  const [superadminEmail, setSuperadminEmail] = useState<string>('superadmin@eventflow.com');
  const [superadminPhone, setSuperadminPhone] = useState<string>('');

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const res = await apiRequest<{ success?: boolean; data?: { email: string; phone?: string } }>('/public/contact');
        if (res?.data) {
          if (res.data.email) setSuperadminEmail(res.data.email);
          if (res.data.phone) setSuperadminPhone(res.data.phone);
        }
      } catch {
        // Keep default values
      }
    };
    fetchContactInfo();
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Brand + Description */}
        <div className="text-center sm:text-left mb-8">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EventFlow</span>
          </div>
          <p className="text-gray-500 text-sm max-w-sm mx-auto sm:mx-0">
            The modern event management platform for creators and organizers.
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 sm:gap-10 mb-8">
          {/* Pages */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Pages</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Home</Link></li>
              <li><Link to="/events" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Browse Events</Link></li>
              <li><Link to="/login" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Login</Link></li>
              <li><Link to="/signup" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Account</h4>
            <ul className="space-y-2">
              <li><Link to="/profile" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">My Profile</Link></li>
              <li><Link to="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">My Tickets</Link></li>
              <li><Link to="/organizer/events/create" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Create Event</Link></li>
              <li><Link to="/become-organizer" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Become an Organizer</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">About Us</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${superadminEmail}&su=Contact EventFlow`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{superadminEmail}</span>
                </a>
              </li>
              {superadminPhone && (
                <li>
                  <a href={`tel:${superadminPhone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{superadminPhone}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          © 2026 EventFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}