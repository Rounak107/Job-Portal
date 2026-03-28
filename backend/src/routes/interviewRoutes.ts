// backend/src/routes/interviewRoutes.ts
import express from 'express';
import { startInterview, continueInterview } from '../controllers/interviewController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/start', authMiddleware, startInterview);
router.post('/continue', authMiddleware, continueInterview);

export default router;
