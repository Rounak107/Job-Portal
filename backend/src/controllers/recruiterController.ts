// backend/src/controllers/recruiterController.ts
import { Request, Response } from "express";
import prisma from "../prisma";
import { Role } from "@prisma/client";

/**
 * GET /api/recruiter/me
 */
export const getRecruiterMe = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });
    if (![Role.RECRUITER, Role.ADMIN].includes(currentUser.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // recruiter profile
    const profile = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, name: true, email: true, loginCount: true },
    });

    // recruiter jobs
    const jobs = await prisma.job.findMany({
      where: { postedById: currentUser.id },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        createdAt: true,
        views: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const jobCount = jobs.length;
    const totalViews = jobs.reduce((s, j) => s + (j.views || 0), 0);
    const totalApplications = jobs.reduce(
      (s, j) => s + (j._count?.applications || 0),
      0
    );

    // analytics
    const months = 6;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const viewsRaw = await prisma.jobView.findMany({
      where: {
        job: { postedById: currentUser.id },
        createdAt: { gte: start },
      },
      select: { createdAt: true },
    });

    const appsRaw = await prisma.application.findMany({
      where: {
        job: { postedById: currentUser.id },
        createdAt: { gte: start },
      },
      select: { createdAt: true },
    });

    function buildMonthlyCounts(items: { createdAt: Date }[]) {
      const buckets: Record<string, number> = {};
      for (let i = 0; i < months; i++) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth() - (months - 1) + i,
          1
        );
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        buckets[key] = 0;
      }
      items.forEach((it) => {
        const d = new Date(it.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        if (buckets[key] !== undefined) buckets[key] += 1;
      });
      return Object.keys(buckets).map((k) => ({ month: k, count: buckets[k] }));
    }

    return res.json({
      profile,
      stats: {
        jobCount,
        totalViews,
        totalApplications,
        loginCount: profile?.loginCount ?? 0,
      },
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        createdAt: j.createdAt,
        applicationsCount: j._count?.applications || 0,
        views: j.views || 0,
      })),
      analytics: {
        viewsByMonth: buildMonthlyCounts(viewsRaw),
        appsByMonth: buildMonthlyCounts(appsRaw),
      },
    });
  } catch (err: any) {
    console.error("getRecruiterMe error:", err);
    return res.status(500).json({
      message: "Failed to fetch recruiter data",
      error: err.message,
    });
  }
};

/**
 * GET /api/recruiter/applicants
 */
export const getRecruiterApplicants = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });
    if (![Role.RECRUITER, Role.ADMIN].includes(currentUser.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { jobId, page = "1", limit = "20" } = req.query as Record<
      string,
      string
    >;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const baseWhere: any = {
      job: { postedById: currentUser.id },
    };
    if (jobId) baseWhere.jobId = Number(jobId);

    const total = await prisma.application.count({ where: baseWhere });

    const apps = await prisma.application.findMany({
      where: baseWhere,
      include: {
        user: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return res.json({
      total,
      page: pageNum,
      pageSize: apps.length,
      totalPages: Math.ceil(total / pageSize),
      applicants: apps.map((a) => ({
        id: a.id,
        status: a.status,
        appliedAt: a.createdAt,
        resumeUrl: a.resumeUrl, // comes from Application model itself
        user: a.user
          ? { id: a.user.id, name: a.user.name, email: a.user.email }
          : null,
        job: a.job ? { id: a.job.id, title: a.job.title } : null,
      })),
    });
  } catch (err: any) {
    console.error("getRecruiterApplicants error:", err);
    return res.status(500).json({
      message: "Failed to fetch applicants",
      error: err.message,
    });
  }
};
