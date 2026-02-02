// backend/src/routes/jobRoutes.ts
import express from 'express';
import {
    createJob,
    getAllJobs,
    getJobById,
    getJobFilters,
    getMyJobs,
    updateJob,
    deleteJob
} from '../controllers/jobController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

// create job (auth required for recruiters/admin)
router.post('/', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), createJob);

// recruiter-only: list my jobs with counts
router.get('/my', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), getMyJobs);

// update job
router.patch('/:id', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), updateJob);

// delete job
router.delete('/:id', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), deleteJob);

// filter metadata (public)
router.get('/filters', getJobFilters);

// list jobs (public with optional filters)
router.get('/', getAllJobs);

// job details by id
router.get('/:id', getJobById);

export default router;
