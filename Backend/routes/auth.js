// routes/auth.js
import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateRegistration,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Protected routes
router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', validateUpdateProfile, updateProfile);
router.patch('/change-password', validateChangePassword, changePassword);
router.post('/logout', logout);

export default router;