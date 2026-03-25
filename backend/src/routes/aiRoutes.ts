import express from 'express';
import { aiController } from '../controllers/aiController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// CV Enhancement & Generation
router.post('/optimize-cv', authMiddleware, aiController.optimizeCVSection);
router.post('/generate-cv', authMiddleware, aiController.generateCV);

// Interview Practice
router.post('/interview-chat', authMiddleware, aiController.interviewChat);

export default router;
