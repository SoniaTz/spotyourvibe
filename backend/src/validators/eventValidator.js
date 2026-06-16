import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters'),
  fullDescription: z.string().min(20, 'Full description must be at least 20 characters'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date'
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date'
  }),
  maxCapacity: z.number().int().positive('Capacity must be a positive number'),
  venueId: z.string().uuid('Invalid venue ID'),
  categoryId: z.string().uuid('Invalid category ID')
});

export const updateEventSchema = createEventSchema.partial();

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