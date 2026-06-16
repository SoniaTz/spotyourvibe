import express from 'express';
import {
  getCommentsByEvent,
  createComment,
  updateComment,
  deleteComment
} from '../controllers/commentController.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requireUser } from '../middlewares/roleCheck.js';

const router = express.Router();

// Public routes - anyone can view comments
router.get('/events/:eventId', optionalAuth, getCommentsByEvent);

// Protected routes - authenticated users can create comments
router.post('/events/:eventId', authenticate, requireUser, createComment);

// Update/Delete - comment owner, event organizer, or admin
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

export default router;
