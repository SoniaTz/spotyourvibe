import { X, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface OrganizerRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrganizerRequiredModal({ isOpen, onClose }: OrganizerRequiredModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>

              {/* Content */}
              <h3 className="text-2xl text-gray-900 text-center mb-4">
                Organizer Account Required
              </h3>
              
              <p className="text-gray-600 text-center mb-6 leading-relaxed">
                To create and manage events, you need to upgrade to an organizer account and get verified by our admin team.
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    Create unlimited events
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    Access to advanced analytics
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    Manage attendees and tickets
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Link
                  to="/signup"
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center"
                  onClick={onClose}
                >
                  Sign Up as Organizer
                </Link>
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              {/* Note */}
              <p className="text-xs text-gray-500 text-center mt-6">
                Note: Organizer accounts require admin verification before you can publish events.
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
