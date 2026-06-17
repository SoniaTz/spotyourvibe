import { z } from 'zod';

export const applyOrganizerSchema = z.object({
  organizationName: z.string().min(3, 'Organization name must be at least 3 characters'),
  phone: z.string().optional().or(z.literal('')),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  website: z.string().optional().or(z.literal(''))
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
