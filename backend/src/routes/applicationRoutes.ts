
// backend/src/routes/applicationRoutes.ts
import express from 'express';
import prisma from '../prisma';
import {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
  batchUpdateStatus,
  getApplicationAudits,
} from '../controllers/applicationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { Role } from '@prisma/client';
import upload from '../middleware/uploadMiddleware';
import path from 'path';
import { sendApplicantEmail, sendRecruiterNewApplicationEmail } from '../services/emailService';
import cloudinary from '../config/cloudinary';
import fs from 'fs';

const router = express.Router();

/**
 * Standard apply route (JSON body with resumeUrl)
 */
router.post('/jobs/:id/apply', authMiddleware, applyToJob);

/**
 * Apply with file upload (Cloudinary)
 */
router.post('/jobs/:id/apply-file', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'job_applications',
      resource_type: 'raw',
      public_id: `resume_job_${jobId}_user_${userId}_${Date.now()}`,
    });

    // Delete local file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const resumePath = result.secure_url;

    const application = await prisma.application.create({
      data: { resumeUrl: resumePath, userId, jobId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        job: { include: { postedBy: { select: { id: true, name: true, email: true } } } },
      },
    });

    // Background email
    (async () => {
      try {
        if (application.user?.email && application.job?.title) {
          sendApplicantEmail(application.user.email, application.job.title, resumePath);
        }
        const recruiterEmail = application.job?.postedBy?.email;
        if (recruiterEmail) {
          sendRecruiterNewApplicationEmail(
            recruiterEmail,
            application.job.title,
            application.user?.name || application.user?.email || 'Applicant',
            application.user?.email || '',
            resumePath
          );
        }
      } catch (e) {
        console.error('background email failed', e);
      }
    })();

    res.status(201).json(application);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to apply with file', error: err.message });
  }
});

/**
 * Applicant: get their own applications
 */
router.get('/applications/me', authMiddleware, getMyApplications);

/**
 * Recruiter/Admin: get all applicants for a job (single job)
 */
router.get(
  '/jobs/:id/applicants',
  authMiddleware,
  roleMiddleware([Role.RECRUITER, Role.ADMIN]),
  getApplicantsForJob
);

/**
 * ✅ Recruiter/Admin: get applicants across ALL jobs they posted
 * Supports ?jobId=123 (optional), ?page=1&limit=20 (optional)
 */
router.get(
  '/recruiter/applicants',
  authMiddleware,
  roleMiddleware([Role.RECRUITER, Role.ADMIN]),
  async (req, res) => {
    try {
      const recruiterId = (req as any).user.id as number;
      const { jobId, page = '1', limit = '50' } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

      const where: any = { job: { postedById: recruiterId } };
      if (jobId) where.jobId = parseInt(jobId, 10);

      const [total, applications] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            job: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      res.json({
        total,
        page: pageNum,
        pageSize: applications.length,
        totalPages: Math.ceil(total / pageSize),
        applicants: applications,
      });
    } catch (err: any) {
      console.error('get recruiter applicants failed', err);
      res.status(500).json({ message: 'Failed to fetch applicants', error: err.message });
    }
  }
);

/**
 * Recruiter/Admin: update a single application’s status
 */
router.patch(
  '/applications/:id/status',
  authMiddleware,
  roleMiddleware([Role.RECRUITER, Role.ADMIN]),
  updateApplicationStatus
);

/**
 * Recruiter/Admin: batch update statuses
 */
router.patch(
  '/applications/status/batch',
  authMiddleware,
  roleMiddleware([Role.RECRUITER, Role.ADMIN]),
  batchUpdateStatus
);

/**
 * Get audit trail for an application
 */
router.get('/applications/:id/audits', authMiddleware, getApplicationAudits);

/**
 * Resume download (for authorized users)
 */
router.get('/:id/resume', authMiddleware, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const application = await prisma.application.findUnique({ where: { id: appId } });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // If it's already a full Cloudinary URL, just redirect
    if (application.resumeUrl.startsWith('http')) {
      return res.redirect(application.resumeUrl);
    }

    // Fallback for old local files (though they might be gone on Render)
    const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(application.resumeUrl));
    if (fs.existsSync(filePath)) {
      return res.download(filePath);
    }

    res.status(404).json({ message: 'Resume file not found on server' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Failed to download resume', error: err.message });
  }
});

export default router;
