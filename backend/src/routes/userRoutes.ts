// backend/src/routes/userRoutes.ts
import express from 'express';
import { registerUser, loginUser, getCurrentUser, getUserDashboard } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected
router.get('/me', authMiddleware, getCurrentUser);
router.get('/dashboard', authMiddleware, getUserDashboard);

export default router;
