import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ConfirmModal from '../components/ConfirmModal';
import { Users, Ticket, Calendar, Check, X, Shield, Search, Filter, Loader2, Building2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { toast } from 'sonner';

type Tab = 'overview' | 'users' | 'organizers' | 'events' | 'bookings';
const tabs: Tab[] = ['overview', 'users', 'organizers', 'events', 'bookings'];

interface User {
  id: string; name: string; email: string; role: string; verified?: boolean;
  createdAt?: string; bookings?: number; events?: number;
  organizerApplication?: { organizationName: string; phone: string; website: string | null; description: string; status: string } | null;
}

interface OrganizerApplication {
  id: string;
  userId: string;
  organizationName: string;
  phone: string;
  description: string;
  website: string | null;
  documentFile: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string; createdAt?: string };
}

const fallbackUsers: User[] = [
  { id: '2', name: 'Event Organizer', email: 'organizer@eventflow.com', role: 'organizer', verified: true, createdAt: '6 months ago', bookings: 0, events: 12, organizerApplication: { organizationName: 'EventCo', phone: '555-1234', website: 'https://eventco.com', description: 'Professional event organizing company', status: 'APPROVED' } },
];


function mapRole(r: string): string {
  const u = r?.toUpperCase?.() || r || 'user';
  if (u === 'SUPERADMIN') return 'superadmin'; if (u === 'ADMIN') return 'admin'; if (u === 'ORGANIZER') return 'organizer'; return 'user';
}

function friendlyDate(raw: string | undefined): string {
  if (!raw) return 'Recently';
  try {
    const diff = Date.now() - new Date(raw).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch { return raw; }
}

function roleColor(role: string): string {
  if (role === 'organizer') return 'bg-purple-100 text-purple-700 ring-1 ring-purple-300';
  if (role === 'superadmin') return 'bg-red-100 text-red-700 ring-1 ring-red-300';
  if (role === 'admin') return 'bg-amber-100 text-amber-700 ring-1 ring-amber-300';
  return 'bg-blue-100 text-blue-700 ring-1 ring-blue-300';
}

function statusBadge(verified?: boolean, role?: string): { color: string; label: string } | null {
  if (role?.toLowerCase() !== 'organizer') return null;
  if (verified) return { color: 'bg-green-100 text-green-700', label: 'Approved' };
  return { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [orgStatusFilter, setOrgStatusFilter] = useState<'pending' | 'approved'>('pending');
  const [users, setUsers] = useState<User[]>(fallbackUsers);
  const [events, setEvents] = useState<{id: string; title: string; organizer: string; category: string; status: string; date: string; submitted: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [organizerApplications, setOrganizerApplications] = useState<OrganizerApplication[]>([]);
  const [processingApp, setProcessingApp] = useState<string | null>(null);
  const [bookings, setBookings] = useState<{id: string; eventId: string; userName: string; userEmail: string; eventTitle: string; seatsReserved: number; createdAt: string}[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [deletingBooking, setDeletingBooking] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await apiRequest<{ success?: boolean; data?: any[] }>('/admin/bookings');
      if (Array.isArray(res?.data)) {
        const mapped = res.data.map((b: any) => ({
          id: b.id,
          eventId: b.event?.id || '',
          userName: b.user?.name || 'Unknown',
          userEmail: b.user?.email || '',
          eventTitle: b.event?.title || 'Unknown Event',
          seatsReserved: b.seatsReserved || 1,
          createdAt: b.createdAt || ''
        }));
        setBookings(mapped);
      } else {
        setBookings([]);
      }
    } catch { setBookings([]); }
    finally { setBookingsLoading(false); }
  }, []);

  const handleDeleteBooking = async (bookingId: string) => {
    setDeletingBooking(true);
    try {
      await apiRequest(`/admin/bookings/${bookingId}`, { method: 'DELETE' });
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      toast.success('Booking deleted successfully');
    } catch (err) {
      console.error('Failed to delete booking:', err);
      toast.error('Failed to delete booking. Please try again.');
    } finally {
      setDeletingBooking(false);
      setBookingToDelete(null);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await apiRequest<{ success?: boolean; data?: any[] }>('/admin/users');
      if (Array.isArray(res?.data)) {
        const seenEmails = new Set<string>();
        const merged: User[] = [];
        res.data.forEach((u: any) => { 
          const e = u.email?.toLowerCase(); 
          if (e && !seenEmails.has(e)) { 
            seenEmails.add(e); 
            merged.push({ 
              ...u, 
              bookings: u._count?.bookings || u.bookings || 0, 
              events: u._count?.events || u.events || 0 
            }); 
          } 
        });
        fallbackUsers.forEach(u => { const e = u.email?.toLowerCase(); if (e && !seenEmails.has(e)) { seenEmails.add(e); merged.push(u); } });
        setUsers(merged);
      }
    } catch { setUsers(fallbackUsers); }
    finally { setLoading(false); }
  }, []);

  const fetchOrganizerApplications = useCallback(async () => {
    try {
      const res = await apiRequest<{ success?: boolean; data?: OrganizerApplication[] }>('/admin/organizer-applications');
      if (Array.isArray(res?.data)) {
        setOrganizerApplications(res.data);
      }
    } catch { /* silently fail */ }
  }, []);

  const handleDeleteUser = async (userId: string) => {
    setDeleting(true);
    try {
      await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDetailUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const res = await apiRequest<{ success?: boolean; data?: any[] }>('/admin/events');
      if (Array.isArray(res?.data)) {
        const mapped = res.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          organizer: e.organizer?.name || e.organizerName || 'Unknown',
          category: e.category?.name || e.categoryName || 'General',
          status: (e.status || 'pending').toLowerCase(),
          date: e.startDate ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
          submitted: e.createdAt ? friendlyDate(e.createdAt) : 'Recently'
        }));
        setEvents(mapped);
      } else {
        setEvents([]);
      }
    } catch { setEvents([]); }
  }, []);

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingEvent(true);
    try {
      await apiRequest(`/admin/events/${eventId}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
      toast.error('Failed to delete event. Please try again.');
    } finally {
      setDeletingEvent(false);
      setEventToDelete(null);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await apiRequest(`/admin/events/${eventId}/approve`, { method: 'PATCH' });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'approved' } : e));
    } catch (err) {
      console.error('Failed to approve event:', err);
      toast.error('Failed to approve event. Please try again.');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await apiRequest(`/admin/events/${eventId}/reject`, { method: 'PATCH' });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'rejected' } : e));
    } catch (err) {
      console.error('Failed to reject event:', err);
      toast.error('Failed to reject event. Please try again.');
    }
  };

  const handleApproveOrganizer = async (appId: string) => {
    setProcessingApp(appId);
    try {
      await apiRequest(`/admin/organizer-applications/${appId}/approve`, { method: 'PATCH' });
      setOrganizerApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'APPROVED' } : a));
      toast.success('Organizer application approved');
      fetchData();
    } catch (err) {
      console.error('Failed to approve organizer:', err);
      toast.error('Failed to approve organizer. Please try again.');
    } finally {
      setProcessingApp(null);
    }
  };

  const handleRejectOrganizer = async (appId: string) => {
    setProcessingApp(appId);
    try {
      await apiRequest(`/admin/organizer-applications/${appId}/reject`, { method: 'PATCH' });
      setOrganizerApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'REJECTED' } : a));
      toast.success('Organizer application rejected');
    } catch (err) {
      console.error('Failed to reject organizer:', err);
      toast.error('Failed to reject organizer. Please try again.');
    } finally {
      setProcessingApp(null);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/admin/users/${userId}/promote`, { method: 'POST' });
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'ADMIN' } : u));
        setDetailUser(prev => prev && prev.id === userId ? { ...prev, role: 'ADMIN' } : prev);
        toast.success('User promoted to Admin');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to promote user');
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/admin/users/${userId}/demote`, { method: 'POST' });
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'USER' } : u));
        setDetailUser(prev => prev && prev.id === userId ? { ...prev, role: 'USER' } : prev);
        toast.success('Admin role removed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove admin role');
    }
  };

  useEffect(() => { fetchData(); fetchEvents(); fetchOrganizerApplications(); fetchBookings(); }, [fetchData, fetchEvents, fetchOrganizerApplications, fetchBookings]);

  if (!user) { navigate('/login', { replace: true }); return null; }
  if (user.role !== 'admin' && user.role !== 'superadmin') { navigate('/', { replace: true }); return null; }

  const pendingEventsList = events.filter(e => e.status === 'pending');
  const pendingOrganizers = organizerApplications.filter(a => a.status === 'PENDING');
  const approvedOrgs = users.filter(u => u.role?.toLowerCase() === 'organizer' && u.organizerApplication?.status === 'APPROVED');
  const statCards = [
    { label: 'Total Users', value: String(users.length), icon: Users },
    { label: 'Total Bookings', value: String(bookings.length), icon: Ticket },
    { label: 'Total Events', value: String(events.length), icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">Manage users, events, and platform operations</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">{s.label}</span>
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /> : s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-6 py-3 border-b-2 whitespace-nowrap capitalize transition-colors text-sm font-medium ${
                  activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}>{t}</button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Pending Organizer Approvals</h2>
                    <p className="text-sm text-gray-600 mt-1">{pendingOrganizers.length} waiting for review</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">Action Required</span>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingOrganizers.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No pending organizer approvals</div>
                  ) : pendingOrganizers.map(a => (
                    <div key={a.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{a.user?.name}</h3>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{a.organizationName}</span>
                          </div>
                          <p className="text-sm text-gray-600">{a.user?.email}</p>
                          {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveOrganizer(a.id)} disabled={processingApp === a.id} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"><Check className="w-4 h-4" /> Approve</button>
                          <button onClick={() => handleRejectOrganizer(a.id)} disabled={processingApp === a.id} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"><X className="w-4 h-4" /> Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                    <h2 className="text-lg font-semibold text-gray-900">Pending Event Approvals</h2>
                    <p className="text-sm text-gray-600 mt-1">{pendingEventsList.length} events awaiting approval</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">Review Required</span>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingEventsList.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No pending events</div>
                  ) : pendingEventsList.map(e => (
                    <div key={e.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{e.title}</h3>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{e.category}</span>
                          </div>
                          <p className="text-sm text-gray-600">By {e.organizer}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveEvent(e.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><Check className="w-4 h-4" /> Approve</button>
                          <button onClick={() => handleRejectEvent(e.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><X className="w-4 h-4" /> Reject</button>
                          <button onClick={() => setEventToDelete(e.id)} disabled={deletingEvent} className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 text-sm"><X className="w-4 h-4" /> Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..."
                      className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                  <div className="relative">
                    <button onClick={() => setShowRoleFilter(!showRoleFilter)} className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                      <Filter className="w-5 h-5" /> {roleFilter === 'all' ? 'Filter' : roleFilter}
                    </button>
                    {showRoleFilter && (
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                        {['all', 'user', 'organizer', 'pending', 'verified', 'admin'].map(r => (
                          <button key={r} onClick={() => { setRoleFilter(r); setShowRoleFilter(false); }}
                            className={`w-full text-left px-4 py-2 text-sm capitalize hover:bg-gray-50 ${roleFilter === r ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'}`}>
                            {r === 'all' ? 'All Roles' : r === 'verified' ? 'Verified Organizer' : r === 'pending' ? 'Pending Organizer' : r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center"><Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" /></td></tr>
                    ) : users
                      .filter(u => {
                        if (roleFilter === 'all') return true;
                        if (roleFilter === 'pending') return u.role?.toLowerCase() === 'organizer' && u.organizerApplication?.status !== 'APPROVED';
                        if (roleFilter === 'verified') return u.role?.toLowerCase() === 'organizer' && u.organizerApplication?.status === 'APPROVED';
                        return u.role?.toLowerCase() === roleFilter;
                      })
                      .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(u => {
                        const orgStatus = u.organizerApplication?.status;
                        const st = statusBadge(orgStatus === 'APPROVED' ? true : orgStatus === 'PENDING' ? false : undefined, u.role);
                        return (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{u.name}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${roleColor(u.role)}`}>{mapRole(u.role)}</span>
                            </td>
                            <td className="px-6 py-4">
                              {st ? <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${st.color}`}>{st.label}</span> : <span className="text-sm text-gray-500">—</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{friendlyDate(u.createdAt)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {user?.role === 'superadmin' && u.id !== user?.id && u.role?.toUpperCase() !== 'SUPERADMIN' && (
                                  <>
                                    {u.role?.toUpperCase() !== 'ADMIN' ? (
                                      <button onClick={() => handlePromoteToAdmin(u.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Make Admin</button>
                                    ) : (
                                      <button onClick={() => handleDemoteFromAdmin(u.id)} className="text-amber-600 hover:text-amber-800 text-xs font-medium">Remove Admin</button>
                                    )}
                                  </>
                                )}
                                <button onClick={() => setDetailUser(u)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View Details</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'organizers' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button onClick={() => setOrgStatusFilter('pending')}
                  className={`flex-1 px-6 py-3 text-sm font-medium text-center transition-colors ${orgStatusFilter === 'pending' ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500' : 'text-gray-500 hover:bg-gray-50'}`}>
                  Pending ({pendingOrganizers.length})
                </button>
                <button onClick={() => setOrgStatusFilter('approved')}
                  className={`flex-1 px-6 py-3 text-sm font-medium text-center transition-colors ${orgStatusFilter === 'approved' ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:bg-gray-50'}`}>
                  Approved ({approvedOrgs.length})
                </button>
              </div>
              {orgStatusFilter === 'pending' ? (
                pendingOrganizers.length === 0 ? (
                  <div className="p-10 text-center"><h3 className="text-lg text-gray-900">No pending requests</h3></div>
                ) : pendingOrganizers.map(a => (
                  <div key={a.id} className="p-6 hover:bg-gray-50 border-b border-gray-200 last:border-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{a.user?.name}</h3>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Pending</span>
                        </div>
                        <p className="text-sm text-gray-600">{a.user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="w-3 h-3 text-purple-600" />
                          <span className="text-sm text-purple-700 font-medium">{a.organizationName}</span>
                          {a.phone && <span className="text-sm text-gray-500">• {a.phone}</span>}
                        </div>
                        {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                        {a.website && <p className="text-sm text-gray-500 mt-1">{a.website}</p>}
                        <p className="text-xs text-gray-400 mt-1">Applied {friendlyDate(a.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveOrganizer(a.id)} disabled={processingApp === a.id} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"><Check className="w-4 h-4" /> Approve</button>
                        <button onClick={() => handleRejectOrganizer(a.id)} disabled={processingApp === a.id} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"><X className="w-4 h-4" /> Reject</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : approvedOrgs.length === 0 ? (
                <div className="p-10 text-center"><h3 className="text-lg text-gray-900">No approved organizers</h3></div>
              ) : approvedOrgs.map(o => (
                <div key={o.id} className="p-6 hover:bg-gray-50 border-b border-gray-200 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{o.name}</h3>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Verified</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{o.events || 0} events</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Manage Events</h2>
                    <p className="text-sm text-gray-600 mt-1">{events.length} total events</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                      <button key={s} onClick={() => setEventStatusFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          eventStatusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        {s === 'all' ? `All (${events.length})` : s === 'pending' ? `Pending (${events.filter(e => e.status === 'pending').length})` : s === 'approved' ? `Approved (${events.filter(e => e.status === 'approved').length})` : `Rejected (${events.filter(e => e.status === 'rejected').length})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {events.filter(e => eventStatusFilter === 'all' || e.status === eventStatusFilter).length === 0 ? (
                  <div className="p-10 text-center text-gray-500">No events found</div>
                ) : events.filter(e => eventStatusFilter === 'all' || e.status === eventStatusFilter).map(e => (
                  <div key={e.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-gray-900">{e.title}</h3>
                          <button onClick={() => navigate(`/events/${e.id}`)} className="text-xs text-indigo-600 hover:text-indigo-800 underline">View Event</button>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{e.category}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                            e.status === 'approved' ? 'bg-green-100 text-green-700' : e.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{e.status}</span>
                        </div>
                        <p className="text-sm text-gray-600">By {e.organizer}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>Date: {e.date}</span><span>•</span><span>{e.submitted}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {e.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveEvent(e.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><Check className="w-4 h-4" /> Approve</button>
                            <button onClick={() => handleRejectEvent(e.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><X className="w-4 h-4" /> Reject</button>
                          </>
                        )}
                        <button
                          onClick={() => setEventToDelete(e.id)}
                          disabled={deletingEvent}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <X className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
                  <p className="text-sm text-gray-600 mt-1">{bookings.length} total bookings</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seats</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked On</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookingsLoading ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center"><Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" /></td></tr>
                    ) : bookings.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No bookings found</td></tr>
                    ) : bookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{b.userName}</div>
                          <div className="text-sm text-gray-500">{b.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{b.eventTitle}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">{b.seatsReserved}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{friendlyDate(b.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setBookingToDelete(b.id)}
                            disabled={deletingBooking}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-xs font-medium"
                          >
                            <X className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDetailUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetailUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600">{detailUser.name?.charAt(0)}</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{detailUser.name}</h3>
                <p className="text-sm text-gray-500">{detailUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500 block">Role</span><span className={`inline-flex px-2 py-1 mt-1 text-xs font-medium rounded-full capitalize ${roleColor(detailUser.role)}`}>{mapRole(detailUser.role)}</span></div>
              <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500 block">Joined</span><span className="font-medium text-gray-900">{friendlyDate(detailUser.createdAt)}</span></div>
              {detailUser.role === 'organizer' && (
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500 block">Status</span><span className="font-medium text-gray-900">{detailUser.verified ? 'Approved' : 'Pending'}</span></div>
              )}
              <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500 block">Activity</span><span className="font-medium text-gray-900">
                {detailUser.role === 'organizer' ? `${detailUser.events || 0} events` : `${detailUser.bookings || 0} bookings`}
              </span></div>
            </div>
            {detailUser.organizerApplication && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Organizer Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-purple-50 rounded-lg p-3"><span className="text-purple-600 block text-xs font-medium uppercase tracking-wider">Company</span><span className="font-medium text-gray-900">{detailUser.organizerApplication.organizationName}</span></div>
                  <div className="bg-purple-50 rounded-lg p-3"><span className="text-purple-600 block text-xs font-medium uppercase tracking-wider">Phone</span><span className="font-medium text-gray-900">{detailUser.organizerApplication.phone}</span></div>
                  {detailUser.organizerApplication.website && <div className="bg-purple-50 rounded-lg p-3"><span className="text-purple-600 block text-xs font-medium uppercase tracking-wider">Website</span><span className="font-medium text-gray-900 break-all">{detailUser.organizerApplication.website}</span></div>}
                  <div className="bg-purple-50 rounded-lg p-3"><span className="text-purple-600 block text-xs font-medium uppercase tracking-wider">Status</span><span className="font-medium text-gray-900 capitalize">{detailUser.organizerApplication.status.toLowerCase()}</span></div>
                </div>
                {detailUser.organizerApplication.description && <div className="mt-3 bg-purple-50 rounded-lg p-3"><span className="text-purple-600 block text-xs font-medium uppercase tracking-wider mb-1">Description</span><p className="text-sm text-gray-700">{detailUser.organizerApplication.description}</p></div>}
              </div>
            )}
            <div className="mt-6 border-t border-gray-200 pt-4 space-y-2">
              {user?.role === 'superadmin' && detailUser.id !== user?.id && (
                <>
                  {detailUser.role?.toUpperCase() !== 'ADMIN' && detailUser.role?.toUpperCase() !== 'SUPERADMIN' && (
                    <button onClick={() => handlePromoteToAdmin(detailUser.id)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                      <Check className="w-4 h-4" /> Make Admin
                    </button>
                  )}
                  {detailUser.role?.toUpperCase() === 'ADMIN' && (
                    <button onClick={() => handleDemoteFromAdmin(detailUser.id)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors">
                      <X className="w-4 h-4" /> Remove Admin Role
                    </button>
                  )}
                </>
              )}
              {detailUser.role?.toUpperCase() !== 'SUPERADMIN' && (
                <button onClick={() => { setUserToDelete(detailUser.id); setDetailUser(null); }} disabled={deleting} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors">
                  <X className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete User'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone. All their data will be permanently removed."
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Event Modal */}
      <ConfirmModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={() => eventToDelete && handleDeleteEvent(eventToDelete)}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete Event"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Booking Modal */}
      <ConfirmModal
        isOpen={!!bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={() => bookingToDelete && handleDeleteBooking(bookingToDelete)}
        title="Delete Booking"
        message="Are you sure you want to delete this booking? The customer will be notified and their reserved seats will be released."
        confirmText="Delete Booking"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}