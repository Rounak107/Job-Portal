// backend/src/routes/userRoutes.ts
import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getUserDashboard,
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  uploadMyAvatar,
  uploadMyResume, forgotPassword, resetPassword } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);

// forgot/reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected basic
router.get('/me', authMiddleware, getCurrentUser);
router.get('/dashboard', authMiddleware, getUserDashboard);

// ---- Profile routes (corrected paths) ----
router.get('/me/profile', authMiddleware, getMyProfile);
router.patch('/me/profile', authMiddleware, updateMyProfile);
router.get('/:id/profile', authMiddleware, getUserProfile);
router.patch('/me/profile/avatar', authMiddleware, upload.single('file'), uploadMyAvatar);
router.patch('/me/profile/resume', authMiddleware, upload.single('file'), uploadMyResume);

export default router;
