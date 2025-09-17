import { Request, Response } from "express";
import prisma from "../prisma";

export async function getAdminStats(req: Request, res: Response) {
  try {
    const totalRecruiters = await prisma.user.count({ where: { role: "RECRUITER" } });
    const totalApplicants = await prisma.user.count({ where: { role: "USER" } });
    const totalJobs = await prisma.job.count();
    const totalApplications = await prisma.application.count();

    const applicationsByStatus = await prisma.application.groupBy({
      by: ["status"],
      _count: { status: true }
    });

    res.json({
      totalRecruiters,
      totalApplicants,
      totalJobs,
      totalApplications,
      applicationsByStatus
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}

export async function getAllRecruiters(req: Request, res: Response) {
  const recruiters = await prisma.user.findMany({
    where: { role: "RECRUITER" },
    include: {
      jobs: { include: { applications: true } },
    },
  });
  res.json(recruiters);
}

export async function getAllApplicants(req: Request, res: Response) {
  const applicants = await prisma.user.findMany({
    where: { role: "USER" },
    include: { applications: true },
  });
  res.json(applicants);
}

export async function getAllApplications(req: Request, res: Response) {
  const apps = await prisma.application.findMany({
    include: {
      user: true,
      job: { include: { postedBy: true } },
    },
  });
  res.json(apps);
}

export async function getAllJobs(req: Request, res: Response) {
  const jobs = await prisma.job.findMany({
    include: { postedBy: true, applications: true },
  });
  res.json(jobs);
}
