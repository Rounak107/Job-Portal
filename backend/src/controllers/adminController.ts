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
  } catch (err) {
    console.error("getAllRecruiters error", err);
    res.status(500).json({ error: "Failed to fetch recruiters" });
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
      applicantId: a.user?.id ?? null,
      applicantName: a.user?.name ?? "",
      applicantEmail: a.user?.email ?? "",
      status: a.status,
      createdAt: a.createdAt,
    }));

    res.json(transformed);
  } catch (err) {
    console.error("getAllApplications error", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
}
