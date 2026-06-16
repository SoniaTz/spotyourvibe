import express from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents
} from '../controllers/eventController.js';
import { createEventSchema, updateEventSchema, validate } from '../validators/eventValidator.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requireOrganizer } from '../middlewares/roleCheck.js';
import { uploadEventImage } from '../config/multer.js';

const router = express.Router();

// Public routes (optional auth for filtering)
router.get('/', optionalAuth, getAllEvents);
router.get('/:id', optionalAuth, getEventById);

// Organizer routes
router.post(
  '/',
  authenticate,
  requireOrganizer,
  uploadEventImage.single('image'),
  createEvent
);

router.put(
  '/:id',
  authenticate,
  requireOrganizer,
  uploadEventImage.single('image'),
  updateEvent
);

router.delete('/:id', authenticate, requireOrganizer, deleteEvent);
router.get('/my/events', authenticate, requireOrganizer, getMyEvents);

export default router;
