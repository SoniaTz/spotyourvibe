import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../lib/api';

const sections = [
  {
    icon: FileText,
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using SpotYourVibe, you agree to be bound by these Terms & Conditions. If you do not agree to any part of these terms, you may not access or use the platform.',
      'SpotYourVibe reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.'
    ]
  },
  {
    icon: Users,
    title: '2. User Accounts',
    content: [
      'You must be at least 18 years old to create an account on SpotYourVibe.',
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.',
      'You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.',
      'SpotYourVibe reserves the right to suspend or terminate accounts that violate these terms.'
    ]
  },
  {
    icon: Shield,
    title: '3. Event Creation & Management',
    content: [
      'Organizers are solely responsible for the accuracy and legality of the events they create on SpotYourVibe.',
      'SpotYourVibe reserves the right to review, approve, or reject any event submission at its discretion.',
      'Organizers must ensure their events comply with all applicable local, state, and federal laws.',
      'SpotYourVibe is not responsible for any issues, damages, or liabilities arising from events hosted through the platform.'
    ]
  },
  {
    icon: CreditCard,
    title: '4. Payments & Refunds',
    content: [
      'All ticket purchases are final unless a refund policy is explicitly stated by the event organizer.',
      'SpotYourVibe processes payments through secure third-party payment providers.',
      'Service fees and transaction charges may apply to ticket purchases and are non-refundable.',
      'Refund requests should be directed to the event organizer. SpotYourVibe may assist in facilitating refunds at the organizer\'s discretion.'
    ]
  },
  {
    icon: AlertTriangle,
    title: '5. Limitation of Liability',
    content: [
      'SpotYourVibe acts as a platform connecting event organizers and attendees. We are not a party to any transaction between them.',
      'SpotYourVibe shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.',
      'The platform is provided "as is" and "as available" without warranties of any kind, whether express or implied.',
      'In no event shall SpotYourVibe\'s total liability exceed the amount paid by you to SpotYourVibe in the twelve months preceding the claim.'
    ]
  },
  {
    icon: Shield,
    title: '6. Privacy & Data Protection',
    content: [
      'SpotYourVibe collects and processes personal data in accordance with applicable data protection laws including GDPR.',
      'We use your data solely to provide and improve our services, process transactions, and communicate with you.',
      'Your personal information will never be sold to third parties without your explicit consent.',
      'You have the right to access, correct, or delete your personal data at any time through your account settings.'
    ]
  }
];

export default function TermsPage() {
  const [superadminEmail, setSuperadminEmail] = useState<string>('soniaxhediku@gmail.com');

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const res = await apiRequest<{ success?: boolean; data?: { email: string } }>('/public/contact');
        if (res?.data?.email) {
          setSuperadminEmail(res.data.email);
        }
      } catch {
        // Keep default email
      }
    };
    fetchContactInfo();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl text-gray-900 mb-4">Terms & Conditions</h1>
            <p className="text-gray-600 text-lg mb-2">
              Last updated: June 2026
            </p>
            <p className="text-gray-600 max-w-2xl">
              Please read these terms carefully before using SpotYourVibe. By using our platform,
              you acknowledge that you have read, understood, and agree to be bound by these terms.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <section.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              </div>
              <div className="ml-[52px] space-y-3">
                {section.content.map((paragraph, i) => (
                  <p key={i} className="text-gray-600 text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center"
          >
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions about these Terms & Conditions, please contact us at{' '}
              <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${superadminEmail}&su=Terms%20%26%20Conditions%20Inquiry`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-medium">
                {superadminEmail}
              </a>
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}