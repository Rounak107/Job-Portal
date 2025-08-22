// backend/src/controllers/applicationController.ts
import { Request, Response } from 'express';
import prisma from '../prisma';
import {
  sendApplicantEmail,
  sendRecruiterNewApplicationEmail,
  sendStatusUpdateEmail,
} from '../services/emailService';

export const ALLOWED_STATUSES = [
  'PENDING',
  'SHORTLISTED',
  'REJECTED',
  'REVIEWED',
  'ACCEPTED',
] as const;
export type AppStatus = (typeof ALLOWED_STATUSES)[number];

function isValidStatus(s: any): s is AppStatus {
  return typeof s === 'string' && (ALLOWED_STATUSES as readonly string[]).includes(s);
}

// Apply to a job
export const applyToJob = async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id as number | undefined;
    const { resumeUrl } = req.body as { resumeUrl?: string };

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!resumeUrl) return res.status(400).json({ message: 'resumeUrl is required' });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        postedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const already = await prisma.application.findFirst({ where: { jobId, userId } });
    if (already) return res.status(409).json({ message: 'You already applied to this job.' });

    const application = await prisma.application.create({
      data: { resumeUrl, userId, jobId, status: 'PENDING' as any },
      include: {
        user: { select: { id: true, name: true, email: true } },
        job: { include: { postedBy: { select: { id: true, name: true, email: true } } } },
      },
    });

    // Fire & forget emails (log in logs/email.log)
    try {
      if (application.user?.email && application.job?.title) {
        sendApplicantEmail(application.user.email, application.job.title, application.resumeUrl);
      }
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
      console.error('Queueing emails failed (non-fatal):', e);
    }

    res.status(201).json(application);
  } catch (err: any) {
    console.error('applyToJob error:', err);
    res.status(500).json({ message: 'Failed to apply', error: err.message });
  }
};

// My applications
export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const applications = await prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(applications);
  } catch (err: any) {
    console.error('getMyApplications error:', err);
    res.status(500).json({ message: 'Failed to fetch applications', error: err.message });
  }
};

// Applicants for a job
export const getApplicantsForJob = async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { applications: { include: { user: true } } },
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job.applications);
  } catch (err: any) {
    console.error('getApplicantsForJob error:', err);
    res.status(500).json({ message: 'Failed to fetch applicants', error: err.message });
  }
};

// Update status (single)
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const { status, note } = req.body;
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: 'Unauthorized' });
    if (!isValidStatus(status)) return res.status(400).json({ message: 'Invalid status' });

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: { job: true, user: true },
    });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (currentUser.role !== 'ADMIN' && application.job.postedById !== currentUser.id) {
      return res.status(403).json({ message: 'Forbidden — you are not allowed to update this application' });
    }

    if (application.status === status) {
      return res.status(200).json({ message: 'Status unchanged', application });
    }

    const [audit, updated] = await prisma.$transaction([
      prisma.applicationAudit.create({
        data: {
          applicationId: application.id,
          previousStatus: application.status,
          newStatus: status,
          changedById: currentUser.id,
          note: note ?? null,
        },
      }),
      prisma.application.update({
        where: { id: application.id },
        data: { status },
        include: { job: true, user: true },
      }),
    ]);

    try {
      if (updated.user?.email) {
        sendStatusUpdateEmail(updated.user.email, updated.job.title, status, note ?? undefined);
      }
    } catch (e) {
      console.error('sendStatusUpdateEmail failed (non-fatal)', e);
    }

    res.json({ application: updated, audit });
  } catch (err: any) {
    console.error('updateApplicationStatus error:', err);
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

// Batch update statuses
export const batchUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { applicationIds, status, note } = req.body;
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'applicationIds must be a non-empty array' });
    }
    if (!isValidStatus(status)) return res.status(400).json({ message: 'Invalid status' });

    const applications = await prisma.application.findMany({
      where: { id: { in: applicationIds.map((id: any) => parseInt(id, 10)) } },
      include: { job: true, user: true },
    });

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No matching applications found' });
    }

    if (user.role === 'RECRUITER') {
      const notOwned = applications.filter((a) => a.job.postedById !== user.id);
      if (notOwned.length > 0) {
        return res.status(403).json({
          message: 'Forbidden: you do not own all specified applications',
          notOwnedIds: notOwned.map((n) => n.id),
        });
      }
    }

    const txOps: any[] = [];
    for (const app of applications) {
      txOps.push(
        prisma.applicationAudit.create({
          data: {
            applicationId: app.id,
            previousStatus: app.status,
            newStatus: status,
            changedById: user.id,
            note: note ?? null,
          },
        })
      );
      txOps.push(
        prisma.application.update({
          where: { id: app.id },
          data: { status },
        })
      );
    }

    await prisma.$transaction(txOps);

    const emailResults: { id: number; email: string; ok: boolean; error?: any }[] = [];
    for (const app of applications) {
      try {
        if (app.user?.email) {
          sendStatusUpdateEmail(app.user.email, app.job.title, status, note ?? undefined);
          emailResults.push({ id: app.id, email: app.user.email, ok: true });
        } else {
          emailResults.push({ id: app.id, email: '', ok: false, error: 'No applicant email' });
        }
      } catch (err: any) {
        console.error('Failed to queue status update email for app', app.id, err);
        emailResults.push({ id: app.id, email: app.user?.email || '', ok: false, error: err?.message || err });
      }
    }

    return res.json({ message: 'Batch update completed', updated: applications.length, emailResults });
  } catch (err: any) {
    console.error('batchUpdateStatus error:', err);
    return res.status(500).json({ message: 'Batch update failed', error: err.message });
  }
};

// Audits
export const getApplicationAudits = async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (!applicationId) return res.status(400).json({ message: 'Application id required' });

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (user.role !== 'ADMIN' && application.userId !== user.id && application.job.postedById !== user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const audits = await prisma.applicationAudit.findMany({
      where: { applicationId },
      include: { changedBy: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(audits);
  } catch (err: any) {
    console.error('getApplicationAudits error:', err);
    return res.status(500).json({ message: 'Failed to fetch audits', error: err.message });
  }
};
