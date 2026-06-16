import express from 'express';
import { register, login, getMe, getProfile, updateProfile, changePassword, deleteAccount, getSecurityQuestion, resetPassword } from '../controllers/authController.js';
import { registerSchema, loginSchema, validate } from '../validators/authValidator.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.get('/security-question', getSecurityQuestion);
router.post('/reset-password', resetPassword);
router.delete('/delete-account', authenticate, deleteAccount);

export default router;
