import express from 'express';
import { createJob, getAllJobs, getJobById, getJobFilters } from '../controllers/jobController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// create job (auth required)
router.post('/', authMiddleware, createJob);

// filter metadata (public)
router.get('/filters', getJobFilters);

// list jobs (public with optional filters)
router.get('/', getAllJobs);

// job details by id
router.get('/:id', getJobById);

export default router;
