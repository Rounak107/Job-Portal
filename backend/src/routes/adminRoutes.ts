// backend/src/routes/adminRoutes.ts
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";
import {
  getAdminStats,
  getAllRecruiters,
  getAllApplicants,
  getAllApplications,
   getRecruiterById,
  getAllJobs, 
} from "../controllers/adminController";
import prisma from "../prisma";

const router = express.Router();

// Protect all admin routes with auth + admin check
router.use(authMiddleware, requireAdmin);

// Stats overview
router.get("/stats", getAdminStats);

// Recruiters list
router.get("/recruiters", getAllRecruiters);
router.get("/recruiters/:id", async (req, res) => {
  const recruiterId = parseInt(req.params.id);
  const recruiter = await prisma.user.findUnique({
    where: { id: recruiterId },
    include: { jobs: true, applications: true }
  });
  res.json(recruiter);
});


// Applicants list
router.get("/applicants", getAllApplicants);

// Applications list
router.get("/applications", getAllApplications);

// Jobs list
router.get("/jobs", getAllJobs);

export default router;
