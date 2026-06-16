import { z } from 'zod';

export const createBookingSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  seatsReserved: z.number().int().positive('Must book at least 1 seat').max(10, 'Cannot book more than 10 seats at once'),
  contactName: z.string().min(1, 'Contact name is required').optional(),
  contactEmail: z.string().email('Invalid email address').optional(),
  contactPhone: z.string().min(1, 'Phone number is required').optional()
});

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
  };
};