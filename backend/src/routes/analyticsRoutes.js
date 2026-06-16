import express from 'express';
import { getOrganizerDashboardAnalytics, getEventAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireOrganizer } from '../middlewares/roleCheck.js';

const router = express.Router();

// Dashboard overview analytics
router.get('/dashboard', authenticate, requireOrganizer, getOrganizerDashboardAnalytics);

// Single event analytics
router.get('/events/:id', authenticate, requireOrganizer, getEventAnalytics);

export default router;