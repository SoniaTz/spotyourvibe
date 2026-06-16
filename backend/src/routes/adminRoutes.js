import express from 'express';
import {
  getAllOrganizerApplications,
  approveOrganizerApplication,
  rejectOrganizerApplication,
  approveEvent,
  rejectEvent,
  getAllEvents,
  deleteEvent,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBookings,
  deleteBooking,
  createVenue,
  getAllVenues,
  updateVenue,
  deleteVenue,
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getDashboardStats,
  promoteToAdmin,
  demoteFromAdmin
} from '../controllers/adminController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireAdmin, requireSuperAdmin } from '../middlewares/roleCheck.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard Stats
router.get('/stats', getDashboardStats);

// Organizer Applications
router.get('/organizer-applications', getAllOrganizerApplications);
router.patch('/organizer-applications/:id/approve', approveOrganizerApplication);
router.patch('/organizer-applications/:id/reject', rejectOrganizerApplication);

// Events
router.get('/events', getAllEvents);
router.patch('/events/:id/approve', approveEvent);
router.patch('/events/:id/reject', rejectEvent);
router.delete('/events/:id', deleteEvent);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Bookings
router.get('/bookings', getAllBookings);
router.delete('/bookings/:id', deleteBooking);

// Venues
router.post('/venues', createVenue);
router.get('/venues', getAllVenues);
router.put('/venues/:id', updateVenue);
router.delete('/venues/:id', deleteVenue);

// Categories
router.post('/categories', createCategory);
router.get('/categories', getAllCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// SuperAdmin - Manage Admins (superadmin only)
router.post('/users/:id/promote', requireSuperAdmin, promoteToAdmin);
router.post('/users/:id/demote', requireSuperAdmin, demoteFromAdmin);

export default router;