// backend/src/controllers/adminController.ts
import { Request, Response } from "express";
import prisma from "../prisma";

export async function getAdminStats(req: Request, res: Response) {
  try {
    const totalRecruiters = await prisma.user.count({ where: { role: "RECRUITER" } });
    const totalApplicants = await prisma.user.count({ where: { role: "USER" } });
    const totalJobs = await prisma.job.count();
    const totalApplications = await prisma.application.count();

    const applicationsByStatusRaw = await prisma.application.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const applicationsByStatus = applicationsByStatusRaw.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalRecruiters,
      totalApplicants,
      totalJobs,
      totalApplications,
      applicationsByStatus,
    });
  } catch (err) {
    console.error("getAdminStats error", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}

/**
 * Return list of recruiters with aggregated counts:
 * {
 *  id, name, email, createdAt,
 *  jobCount,
 *  applicationsCount,
 *  applicationsByStatus: { ACCEPTED: x, PENDING: y, REJECTED: z, ... }
 * }
 */
export async function getAllRecruiters(req: Request, res: Response) {
  try {
    const recruiters = await prisma.user.findMany({
      where: { role: "RECRUITER" },
      include: {
        jobs: {
          include: {
            applications: {
              select: { status: true }, // we only need status to count
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = recruiters.map((r) => {
      const jobCount = r.jobs.length;
      const applications = r.jobs.flatMap((j) => j.applications || []);
      const applicationsCount = applications.length;
      const applicationsByStatus = applications.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        createdAt: r.createdAt,
        jobCount,
        applicationsCount,
        applicationsByStatus,
      };
    });

    res.json(transformed);
  } catch (err: any) {
    console.error("getAllRecruiters error", err);
    res.status(500).json({
      error: "Failed to fetch recruiters",
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

export async function getRecruiterById(req: Request, res: Response) {
  const recruiterId = Number(req.params.id);
  try {
    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterId },
      include: {
        jobs: {
          include: {
            applications: true,
          },
        },
      },
    });

    if (!recruiter || recruiter.role !== "RECRUITER") {
      return res.status(404).json({ error: "Recruiter not found" });
    }

    // Reformat to match /recruiter/me structure
    const jobCount = recruiter.jobs.length;
    const totalViews = recruiter.jobs.reduce((sum, job) => sum + (job.views || 0), 0);
    const totalApplications = recruiter.jobs.reduce(
      (sum, job) => sum + (job.applications?.length || 0),
      0
    );

    // Build jobs array in the expected format
    const jobs = recruiter.jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      createdAt: job.createdAt,
      applicationsCount: job.applications?.length || 0,
      views: job.views || 0,
    }));

    // Build analytics data (simplified version)
    const now = new Date();
    const months = 6;
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    // You'll need to fetch proper analytics data here
    // For now, returning empty arrays as placeholders
    const viewsByMonth: { month: string; count: number }[] = [];
    const appsByMonth: { month: string; count: number }[] = [];

    res.json({
      profile: {
        id: recruiter.id,
        name: recruiter.name,
        email: recruiter.email,
        loginCount: recruiter.loginCount || 0,
      },
      stats: {
        jobCount,
        totalViews,
        totalApplications,
        loginCount: recruiter.loginCount || 0,
      },
      jobs,
      analytics: {
        viewsByMonth,
        appsByMonth,
      },
    });
  } catch (err) {
    console.error("getRecruiterById error", err);
    res.status(500).json({ error: "Failed to fetch recruiter" });
  }
}
export async function getAllJobs(req: Request, res: Response) {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        postedBy: { select: { id: true, name: true, email: true } },
        applications: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(jobs);
  } catch (err) {
    console.error("getAllJobs error", err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}

/**
 * Return list of applicants including their applications (job title/company),
 * and a quick applicationCount + latestApplication summary.
 */
export async function getAllApplicants(req: Request, res: Response) {
  try {
    const applicants = await prisma.user.findMany({
      where: { role: "USER" },
      include: {
        applications: {
          include: {
            job: {
              select: { id: true, title: true, company: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = applicants.map((a) => {
      const apps = a.applications || [];
      const applicationCount = apps.length;
      // assume createdAt order; pick last application (if any)
      const lastApp = apps.length ? apps[apps.length - 1] : null;

      return {
        id: a.id,
        name: a.name,
        email: a.email,
        createdAt: a.createdAt,
        applicationCount,
        latestApplication: lastApp
          ? {
            jobId: lastApp.job?.id,
            jobTitle: lastApp.job?.title,
            company: lastApp.job?.company,
            status: lastApp.status,
            appliedAt: lastApp.createdAt,
          }
          : null,
        // optionally include full applications if you want:
        applications: apps.map((ap) => ({
          id: ap.id,
          jobId: ap.job?.id,
          jobTitle: ap.job?.title,
          company: ap.job?.company,
          status: ap.status,
          createdAt: ap.createdAt,
        })),
      };
    });

    res.json(transformed);
  } catch (err) {
    console.error("getAllApplicants error", err);
    res.status(500).json({ error: "Failed to fetch applicants" });
  }
}

/**
 * Return all applications with job title/company and applicant info:
 * { id, jobTitle, jobCompany, applicantName, applicantEmail, status, createdAt }
 */
export async function getAllApplications(req: Request, res: Response) {
  try {
    const apps = await prisma.application.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true, company: true, postedById: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = apps.map((a) => ({
      id: a.id,
      jobId: a.job?.id ?? null,
      jobTitle: a.job?.title ?? "",
      jobCompany: a.job?.company ?? "",
      recruiterId: a.job?.postedById ?? null,
      applicantId: a.user?.id ?? null,
      applicantName: a.user?.name ?? "",
      applicantEmail: a.user?.email ?? "",
      status: a.status,
      createdAt: a.createdAt,
    }));

    res.json(transformed);
  } catch (err: any) {
    console.error("getAllApplications error", err);
    res.status(500).json({
      error: "Failed to fetch applications",
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
