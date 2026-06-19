import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Toaster from './components/Toaster';
import LandingPage from './pages/LandingPage';
import BrowseEvents from './pages/BrowseEvents';
import EventDetail from './pages/EventDetail';
import Checkout from './pages/Checkout';
import UserDashboard from './pages/UserDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import EventAnalytics from './pages/EventAnalytics';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import BecomeOrganizer from './pages/BecomeOrganizer';
import TermsPage from './pages/TermsPage';
import ForgotPassword from './pages/ForgotPassword';
import Favorites from './pages/Favorites';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<BrowseEvents />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/events/create" element={<CreateEvent />} />
          <Route path="/organizer/events/:id/edit" element={<EditEvent />} />
          <Route path="/organizer/events/:id/analytics" element={<EventAnalytics />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/become-organizer" element={<BecomeOrganizer />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
