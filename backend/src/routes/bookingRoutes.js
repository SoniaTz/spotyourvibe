import express from 'express';
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getBookingById,
  getEventSeats
} from '../controllers/bookingController.js';
import { createBookingSchema, validate } from '../validators/bookingValidator.js';
import { authenticate } from '../middlewares/auth.js';
import { requireUser } from '../middlewares/roleCheck.js';

const router = express.Router();

router.get('/seats/:eventId', getEventSeats);
router.post('/', authenticate, requireUser, validate(createBookingSchema), createBooking);
router.get('/my', authenticate, requireUser, getMyBookings);
router.get('/:id', authenticate, requireUser, getBookingById);
router.delete('/:id', authenticate, requireUser, cancelBooking);

export default router;
