// backend/src/routes/recruiterRoutes.ts
import express from 'express';
import { getRecruiterMe, getRecruiterApplicants } from '../controllers/recruiterController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.get('/me', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), getRecruiterMe);
router.get('/applicants', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), getRecruiterApplicants);

export default router;
