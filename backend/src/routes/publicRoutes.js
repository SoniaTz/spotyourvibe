import express from 'express';
import { getAllCategories } from '../controllers/adminController.js';
import { getAllVenues } from '../controllers/adminController.js';
import { getContactInfo } from '../controllers/publicController.js';

const router = express.Router();

// Public access to categories and venues for event browsing
router.get('/categories', getAllCategories);
router.get('/venues', getAllVenues);
router.get('/contact', getContactInfo);

export default router;
