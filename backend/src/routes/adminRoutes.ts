// backend/src/routes/adminRoutes.ts
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";
import {
  getAdminStats,
  getAllRecruiters,
  getAllApplicants,
  getAllApplications,
  getAllJobs,
} from "../controllers/adminController";

const router = express.Router();

// Protect all admin routes with auth + admin check
router.use(authMiddleware, requireAdmin);

// Stats overview
router.get("/stats", getAdminStats);

// Recruiters list
router.get("/recruiters", getAllRecruiters);

// Applicants list
router.get("/applicants", getAllApplicants);

// Applications list
router.get("/applications", getAllApplications);

// Jobs list
router.get("/jobs", getAllJobs);

export default router;
