// src/routes/applicationRoutes.ts
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


const router = express.Router();

router.post('/jobs/:id/apply', authMiddleware, applyToJob);

// file upload apply route (preserves your previous behavior)
router.post('/jobs/:id/apply-file', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const resumeUrl = `/uploads/${req.file.filename}`;

    const existing = await prisma.application.findFirst({ where: { jobId, userId } });
    if (existing) return res.status(400).json({ message: 'You already applied to this job.' });

    const application = await prisma.application.create({
  data: { resumeUrl, userId, jobId },
  include: {
    user: { select: { id: true, name: true, email: true } },
    job: {
      include: {
        postedBy: { select: { id: true, name: true, email: true } }, // ✅ recruiter relation
      },
    },
  },
});

    // send email in background (uses queue)
    (async () => {
      try {
  if (application.user?.email && application.job?.title) {
    sendApplicantEmail(application.user.email, application.job.title, application.resumeUrl);
  }
  // recruiter too (need job.postedBy include when you fetch/create)
  const recruiterEmail = application.job?.postedBy?.email;
  if (recruiterEmail) {
    sendRecruiterNewApplicationEmail(
      recruiterEmail,
      application.job.title,
      application.user?.name || application.user?.email || 'Applicant',
      application.user?.email || '',
      application.resumeUrl
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

router.get('/me', authMiddleware, getMyApplications);
router.get('/job/:id', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), getApplicantsForJob);

// Update single application status (role enforced in route)
router.patch('/:id/status', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), updateApplicationStatus);

// Batch update statuses (recruiter or admin)
router.post('/batch-status', authMiddleware, roleMiddleware([Role.RECRUITER, Role.ADMIN]), batchUpdateStatus);

// Get audit trail for an application (auth required)
router.get('/:id/audits', authMiddleware, getApplicationAudits);

// Resume download route preserved
router.get('/:id/resume', authMiddleware, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const application = await prisma.application.findUnique({ where: { id: appId } });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(application.resumeUrl));
    res.download(filePath);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Failed to download resume', error: err.message });
  }
});

export default router;
