// backend/src/controllers/jobController.ts
import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '@prisma/client';
import { aiService } from '../services/aiService';

/**
 * Safely parse a number from query/body, returning null if empty/NaN.
 */
function parseOptionalNumber(value: any): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Create Job
 */
export const createJob = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });
    if (![Role.RECRUITER, Role.ADMIN].includes(currentUser.role)) {
      return res
        .status(403)
        .json({ message: "Only recruiters/admin can create jobs" });
    }

    const {
      title,
      company,
      location,
      description,
      salaryMin,
      salaryMax,
      workMode,
      role,
      incentive, // ✅ new
      workTime,  // ✅ new
    } = req.body;

    if (!title || !company || !location || !description) {
      return res
        .status(400)
        .json({ message: "title, company, location and description are required" });
    }

    const min = parseOptionalNumber(salaryMin);
    const max = parseOptionalNumber(salaryMax);

    if (min !== null && max !== null && min > max) {
      return res
        .status(400)
        .json({ message: "salaryMin cannot be greater than salaryMax" });
    }

    const job = await prisma.job.create({
      data: {
        title: String(title).trim(),
        company: String(company).trim(),
        location: String(location).trim(),
        description: String(description),
        postedById: currentUser.id,
        salaryMin: min,
        salaryMax: max,
        workMode: workMode ?? undefined,
        role: role ?? null,
        incentive: incentive ? String(incentive).trim() : null, // ✅
        workTime: workTime ? String(workTime).trim() : null,   // ✅
      },
    });

    return res.status(201).json({ message: "Job created successfully", job });
  } catch (err: any) {
    console.error("createJob error:", err);
    return res.status(500).json({ message: "Error creating job", error: err.message });
  }
};


/**
 * Get all jobs with multi-field case-insensitive search + filters + salary-range overlap logic
 */
// backend/src/controllers/jobController.ts
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const {
      search,
      title,
      location,
      company,
      role,
      workMode,
      minSalary,
      maxSalary,
      page = '1',
      limit = '10',
      sort = 'desc',
      ids,                     // <-- NEW
    } = req.query as Record<string, string>;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const sortOrder = (sort === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const where: any = {};

    // NEW: ids filter (comma-separated or repeated)
    if (ids) {
      const list = (Array.isArray(ids) ? ids : ids.split(','))
        .map((s) => parseInt(String(s).trim(), 10))
        .filter((n) => Number.isFinite(n));
      if (list.length > 0) {
        where.id = { in: list };
      }
    }

    // existing combined search
    const searchTerm = (title as string) || (search as string) || '';
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { company: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (company) where.company = { contains: company, mode: 'insensitive' };
    if (role) where.role = role;
    if (workMode) where.workMode = workMode as any;

    // salary overlap logic (unchanged)
    const minS = minSalary !== undefined && minSalary !== null ? Number(minSalary) : undefined;
    const maxS = maxSalary !== undefined && maxSalary !== null ? Number(maxSalary) : undefined;
    if (minS !== undefined || maxS !== undefined) {
      where.AND = where.AND || [];
      if (minS !== undefined) where.AND.push({ salaryMax: { gte: minS } });
      if (maxS !== undefined) where.AND.push({ salaryMin: { lte: maxS } });
    }

    const total = await prisma.job.count({ where });

    const jobs = await prisma.job.findMany({
      where,
      include: { postedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: sortOrder },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    });

    return res.json({
      total,
      page: pageNumber,
      pageSize: jobs.length,
      totalPages: Math.ceil(total / pageSize),
      filtersApplied: {
        search: searchTerm || '',
        location: location || '',
        company: company || '',
        role: role || '',
        workMode: workMode || '',
        minSalary: minS ?? null,
        maxSalary: maxS ?? null,
        sort: sortOrder,
        ids: ids || '',
      },
      jobs,
    });
  } catch (err: any) {
    console.error('getAllJobs error:', err);
    return res.status(500).json({ message: 'Error fetching jobs', error: err.message });
  }
};

/**
 * Get job by id
 */
export const getJobById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // create a JobView entry (don't count if the poster is viewing their own job)
    const currentUser = (req as any).user;
    if (!currentUser || currentUser.id !== job.postedById) {
      // add JobView and increment job.views atomically
      await prisma.$transaction([
        prisma.jobView.create({ data: { jobId: id, userId: currentUser?.id ?? undefined, ip: (req.ip || null) } }),
        prisma.job.update({ where: { id }, data: { views: { increment: 1 } } }),
      ]);
    }

    // return includes
    const jobWithDetails = await prisma.job.findUnique({
      where: { id },
      include: { postedBy: true, applications: true },
    });

    return res.json(jobWithDetails);
  } catch (err: any) {
    console.error('getJobById error:', err);
    return res.status(500).json({ message: 'Error fetching job', error: err.message });
  }
};


/**
 * GET /api/jobs/filters
 * Return filter metadata (companies, locations, roles, workModes, salary min/max)
 */
export const getJobFilters = async (req: Request, res: Response) => {
  try {
    const companiesRaw = await prisma.job.findMany({
      distinct: ['company'],
      select: { company: true },
      orderBy: { company: 'asc' },
    });
    const locationsRaw = await prisma.job.findMany({
      distinct: ['location'],
      select: { location: true },
      orderBy: { location: 'asc' },
    });
    const rolesRaw = await prisma.job.findMany({
      distinct: ['role'],
      select: { role: true },
      orderBy: { role: 'asc' },
    });
    const workModesRaw = await prisma.job.findMany({
      distinct: ['workMode'],
      select: { workMode: true },
      orderBy: { workMode: 'asc' },
    });

    const companies = companiesRaw.map((c) => c.company).filter(Boolean);
    const locations = locationsRaw.map((l) => l.location).filter(Boolean);
    const roles = rolesRaw.map((r) => r.role).filter(Boolean) as string[];
    const workModes = workModesRaw.map((w) => w.workMode).filter(Boolean) as string[];

    const agg = await prisma.job.aggregate({
      _min: { salaryMin: true },
      _max: { salaryMax: true },
    });

    return res.json({
      companies,
      locations,
      roles,
      workModes,
      salaryMin: agg._min.salaryMin ?? null,
      salaryMax: agg._max.salaryMax ?? null,
    });
  } catch (err: any) {
    console.error('getJobFilters error:', err);
    return res.status(500).json({ message: 'Failed to fetch filters', error: err.message });
  }
};

/**
 * Get jobs created by the current recruiter (with application counts)
 * GET /api/jobs/my
 */
export const getMyJobs = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: 'Unauthorized' });
    if (![Role.RECRUITER, Role.ADMIN].includes(currentUser.role)) {
      return res.status(403).json({ message: 'Only recruiters/admin can access this resource' });
    }

    const { page = '1', limit = '10', sort = 'desc' } = req.query as Record<string, string>;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const sortOrder = (sort === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const where = { postedById: currentUser.id };

    const total = await prisma.job.count({ where });
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    });

    return res.json({
      total,
      page: pageNumber,
      pageSize: jobs.length,
      totalPages: Math.ceil(total / pageSize),
      jobs: jobs.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        createdAt: j.createdAt,
        applicationsCount: j._count.applications,
      })),
    });
  } catch (err: any) {
    console.error('getMyJobs error:', err);
    return res.status(500).json({ message: 'Failed to fetch recruiter jobs', error: err.message });
  }
};

/**
 * Update Job
 */
export const updateJob = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Only owner or admin can update
    if (job.postedById !== currentUser.id && currentUser.role !== Role.ADMIN) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const {
      title,
      company,
      location,
      description,
      salaryMin,
      salaryMax,
      workMode,
      role,
      incentive,
      workTime,
    } = req.body;

    const min = parseOptionalNumber(salaryMin);
    const max = parseOptionalNumber(salaryMax);

    if (min !== null && max !== null && min > max) {
      return res.status(400).json({ message: "salaryMin cannot be greater than salaryMax" });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        company: company !== undefined ? String(company).trim() : undefined,
        location: location !== undefined ? String(location).trim() : undefined,
        description: description !== undefined ? String(description) : undefined,
        salaryMin: min !== undefined ? min : undefined,
        salaryMax: max !== undefined ? max : undefined,
        workMode: workMode ?? undefined,
        role: role ?? undefined,
        incentive: incentive !== undefined ? String(incentive).trim() : undefined,
        workTime: workTime !== undefined ? String(workTime).trim() : undefined,
      },
    });

    return res.json({ message: "Job updated successfully", job: updatedJob });
  } catch (err: any) {
    console.error("updateJob error:", err);
    return res.status(500).json({ message: "Error updating job", error: err.message });
  }
};

/**
 * Delete Job
 */
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Only owner or admin can delete
    if (job.postedById !== currentUser.id && currentUser.role !== Role.ADMIN) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Use transaction to delete dependencies if needed (Prisma onDelete: Cascade handles jobViews)
    // Applications also need to be handled or the FK will break
    await prisma.$transaction([
      prisma.applicationAudit.deleteMany({ where: { application: { jobId: id } } }),
      prisma.application.deleteMany({ where: { jobId: id } }),
      prisma.job.delete({ where: { id } }),
    ]);

    return res.json({ message: "Job deleted successfully" });
  } catch (err: any) {
    console.error("deleteJob error:", err);
    return res.status(500).json({ message: "Error deleting job", error: err.message });
  }
};

/**
 * AI: Get Recommended Jobs for the current user
 * GET /api/jobs/recommendations
 * Uses a smart AI prompt that factors in career trajectory, existing applications,
 * salary expectations and skills to recommend the best-fit opportunities.
 */
export const getJobRecommendations = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

    // 1. Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        name: true,
        bio: true,
        skills: true,
        experience: true,
        education: true,
      }
    });

    if (!user) return res.status(404).json({ message: "User profile not found" });

    // 2. Fetch user's existing applications to understand career preferences
    //    and exclude jobs they've already applied to
    const myApplications = await prisma.application.findMany({
      where: { userId: currentUser.id },
      select: {
        jobId: true,
        job: {
          select: {
            title: true,
            company: true,
            salaryMin: true,
            salaryMax: true,
            role: true,
            workMode: true,
          }
        }
      }
    });

    const alreadyAppliedJobIds = new Set(myApplications.map(a => a.jobId));

    // Derive career context from applications for smarter matching
    const appliedTitles = myApplications.map(a => a.job?.title).filter(Boolean);
    const appliedSalaries = myApplications
      .map(a => a.job?.salaryMax)
      .filter((s): s is number => s !== null && s !== undefined && s > 0);
    const avgAppliedSalary = appliedSalaries.length > 0
      ? Math.round(appliedSalaries.reduce((a, b) => a + b, 0) / appliedSalaries.length)
      : null;

    // 3. Fetch available jobs (excluding already applied)
    const allJobs = await prisma.job.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        role: true,
        workMode: true,
        workTime: true,
        incentive: true,
        createdAt: true,
      }
    });

    // Exclude jobs the user has already applied to
    const availableJobs = allJobs.filter(j => !alreadyAppliedJobIds.has(j.id));

    if (availableJobs.length === 0) {
      // If all available jobs are applied to, return recently posted ones
      return res.json({ recommendations: [] });
    }

    // 4. Build a rich, professional AI prompt
    const hasProfile = !!(user.skills || user.bio || user.experience);

    const profileSection = `
CANDIDATE PROFILE:
- Name: ${user.name || 'Not provided'}
- Professional Summary: ${user.bio || 'Not provided'}
- Skills & Technologies: ${user.skills || 'Not provided'}
- Work Experience: ${user.experience || 'Not provided'}
- Education: ${user.education || 'Not provided'}
`;

    const careerContextSection = appliedTitles.length > 0 ? `
CAREER TRAJECTORY (From their existing job applications):
- Roles they have already applied for: ${appliedTitles.join(', ')}
- Average salary they are targeting: ${avgAppliedSalary ? `₹${avgAppliedSalary} LPA` : 'Unknown'}
- This reveals their experience level and career goals. Prioritize similar roles or natural next steps.
` : `
CAREER TRAJECTORY: No previous applications found. Analyse profile and recommend broadly suitable opportunities.
`;

    const jobsSection = availableJobs.map((j) => `
[JOB ID: ${j.id}]
Title: ${j.title}
Company: ${j.company}
Role Category: ${j.role || 'General'}
Work Mode: ${j.workMode}
Work Time: ${j.workTime || 'Full-time'}
Location: ${j.location}
Salary Range: ₹${j.salaryMin ?? 0} - ₹${j.salaryMax ?? 0} LPA
Posted: ${j.createdAt.toISOString().split('T')[0]}
Description: ${j.description?.substring(0, 250) ?? 'N/A'}...
`).join('\n---\n');

    const systemPrompt = `You are an expert AI Career Advisor at an industry-leading recruitment platform.
Your task is to match a candidate to the single best 6 job opportunities from the list provided.

MATCHING CRITERIA (prioritize in this order):
1. SKILL ALIGNMENT: Does the job require skills the candidate has listed?
2. EXPERIENCE & SALARY FIT: Prefer jobs where the salary range aligns with what they are already targeting. A candidate applying for ₹8000-12000 LPA roles should NOT be recommended jobs at ₹50,000+ LPA as they would likely be unqualified.
3. CAREER TRAJECTORY: Prioritize jobs in the same domain/category as their existing applications.
4. RECENCY: Prefer newer job postings.
5. ACCESSIBILITY: If profile is sparse, prefer entry-level or trainee roles with lower salary requirements.

IMPORTANT RULES:
- ONLY select from the jobs provided in the list. Never invent job IDs.
- Respond ONLY with a valid JSON array. No markdown, no explanation text outside the JSON.
- Response format MUST be exactly:
[
  {"id": <number>, "matchScore": <0-100>, "fitReason": "<max 12 words why this matches>"},
  ...
]`;

    const userPrompt = `${profileSection}${careerContextSection}

AVAILABLE JOBS TO EVALUATE:
${jobsSection}

Select the best 6 matches. Return JSON only.`;

    // 5. Call AI
    const aiResponse = await aiService.generateText(userPrompt, systemPrompt);

    // 6. Parse AI response and merge with full job data
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI response does not contain a JSON array");

      const scoredJobs: {id: number, matchScore: number, fitReason: string}[] = JSON.parse(jsonMatch[0]);

      const finalRecommendations = scoredJobs
        .map(sj => {
          const jobData = availableJobs.find(j => j.id === sj.id);
          if (!jobData) return null;
          return {
            ...jobData,
            matchScore: Math.min(100, Math.max(0, sj.matchScore)),
            fitReason: sj.fitReason
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.matchScore - a.matchScore);

      return res.json({ recommendations: finalRecommendations });

    } catch (parseErr) {
      console.error("AI Response Parsing Error:", parseErr, "\nRaw Response:", aiResponse);
      // Smart fallback: return newest jobs with a clear label
      const fallbackJobs = availableJobs.slice(0, 6).map(j => ({
        ...j,
        matchScore: 65,
        fitReason: "Trending opportunity matching your career area."
      }));
      return res.json({ recommendations: fallbackJobs });
    }

  } catch (err: any) {
    console.error("getJobRecommendations error:", err);
    return res.status(500).json({ message: "Error generating recommendations", error: err.message });
  }
};


