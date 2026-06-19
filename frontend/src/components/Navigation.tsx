import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Ticket, LogOut, Shield, User, Heart } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-gray-900">SpotYourVibe</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm transition-colors ${
                isActive('/') ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/events"
              className={`text-sm transition-colors ${
                isActive('/events') ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse Events
            </Link>
            
            {isAuthenticated && user?.role === 'organizer' && (
              <Link
                to="/organizer/dashboard"
                className={`text-sm transition-colors ${
                  isActive('/organizer/dashboard') ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Events
              </Link>
            )}
            
            {isAuthenticated && (user?.role === 'user' || user?.role === 'organizer') && (
              <Link
                to="/dashboard"
                className={`text-sm transition-colors ${
                  isActive('/dashboard') ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Tickets
              </Link>
            )}
            
            {isAuthenticated && (
              <Link
                to="/favorites"
                className={`text-sm transition-colors flex items-center gap-1 ${
                  isActive('/favorites') ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Heart className="w-4 h-4" />
                Favorites
              </Link>
            )}

            {isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin') && (
              <Link
                to="/admin/dashboard"
                className={`text-sm transition-colors flex items-center gap-1 ${
                  isActive('/admin/dashboard') ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user?.role === 'organizer' && user?.verified && (
              <Link
                to="/organizer/events/create"
                className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Create Event
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NotificationsDropdown />
                <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm text-indigo-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <div className="text-gray-900">{user?.name}</div>
                        <div className="text-sm text-gray-600">{user?.email}</div>
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full capitalize">
                            {user?.role}
                          </span>
                          {user?.role === 'organizer' && (
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              user?.verified 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {user?.verified ? 'Verified' : 'Pending'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                        >
                          <User className="w-4 h-4" />
                  My Profile
                        </Link>
                        {user?.role === 'user' || user?.role === 'organizer' ? (
                          <Link
                            to="/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            My Tickets
                          </Link>
                        ) : null}
                        {user?.role === 'organizer' && (
                          <Link
                            to="/organizer/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            Organizer Dashboard
                          </Link>
                        )}
                        {(user?.role === 'admin' || user?.role === 'superadmin') && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-4 space-y-3">
              {isAuthenticated && (
                <div className="pb-3 mb-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-900">{user?.name}</div>
                      <div className="text-sm text-gray-600">{user?.email}</div>
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full capitalize">
                          {user?.role}
                        </span>
                      </div>
                    </div>
                    <NotificationsDropdown />
                  </div>
                </div>
              )}
              
              <Link
                to="/"
                className="block px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/events"
                className="block px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Events
              </Link>
              
              {isAuthenticated ? (
                <>
                  {(user?.role === 'user' || user?.role === 'organizer') && (
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Tickets
                    </Link>
                  )}
                  <Link
                    to="/favorites"
                    className="block px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Favorites
                  </Link>
                  {user?.role === 'organizer' && (
                    <>
                      <Link
                        to="/organizer/dashboard"
                        className="block px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Events
                      </Link>
                      {user?.verified && (
                        <Link
                          to="/organizer/events/create"
                          className="block px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Create Event
                        </Link>
                      )}
                    </>
                  )}
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <Link
                      to="/admin/dashboard"
                      className="block px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}