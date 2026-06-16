import express from 'express';
import { applyForOrganizer, getMyApplication } from '../controllers/organizerController.js';
import { createVenue, getAllVenues, updateVenue } from '../controllers/adminController.js';
import { createCategory, getAllCategories } from '../controllers/adminController.js';
import { applyOrganizerSchema, validate } from '../validators/organizerValidator.js';
import { authenticate } from '../middlewares/auth.js';
import { requireOrganizer } from '../middlewares/roleCheck.js';
import { uploadDocument } from '../config/multer.js';
const router = express.Router();

// Organizer application
router.post(
  '/apply',
  authenticate,
  uploadDocument.single('document'),
  validate(applyOrganizerSchema),
  applyForOrganizer
);

router.get('/my-application', authenticate, getMyApplication);

// Venues - organizers can create venues for their events
router.post('/venues', authenticate, requireOrganizer, createVenue);
router.get('/venues', authenticate, requireOrganizer, getAllVenues);

// Venues - organizers can update their venues
router.put('/venues/:id', authenticate, requireOrganizer, updateVenue);

// Categories - organizers can create categories for their events
router.post('/categories', authenticate, requireOrganizer, createCategory);
router.get('/categories', authenticate, requireOrganizer, getAllCategories);

export default router;
