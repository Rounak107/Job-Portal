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
 */
export const getJobRecommendations = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

    // 1. Fetch user profile for analysis
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

    // 2. Fetch recent active jobs (limit to 30 for efficient AI matching)
    // In a real production app, you might use vector search (RAG) first, 
    // but for this MVP, we analyze the most recent relevant jobs.
    const jobs = await prisma.job.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
      }
    });

    if (jobs.length === 0) {
      return res.json({ recommendations: [] });
    }

    // 3. Prepare AI Prompt
    const profileSummary = `
      Name: ${user.name}
      Bio: ${user.bio || 'Not provided'}
      Skills: ${user.skills || 'Not provided'}
      Experience: ${user.experience || 'Not provided'}
      Education: ${user.education || 'Not provided'}
    `;

    const jobsList = jobs.map((j, i) => `
      --- JOB ${i} [ID: ${j.id}] ---
      Title: ${j.title}
      Company: ${j.company}
      Location: ${j.location}
      Description Snippet: ${j.description.substring(0, 300)}...
      Salary: ${j.salaryMin}-${j.salaryMax}
    `).join('\n');

    const systemPrompt = `You are an advanced AI Career Advisor. Your goal is to match a user's profile with the best available job opportunities.
    Analyze the user profile and the list of jobs provided. 
    Select the top 6 jobs that are the best fit for this user.
    For each selected job, provide:
    1. The job ID.
    2. A matchScore (0-100).
    3. A brief "fitReason" (max 15 words) explaining why this is a good match.
    
    IMPORTANT: Respond ONLY with a valid JSON array of objects, like this:
    [
      {"id": 1, "matchScore": 95, "fitReason": "Your expertise in React matches their senior frontend requirements perfectly."},
      ...
    ]`;

    const userPrompt = `User Profile:\n${profileSummary}\n\nAvailable Jobs:\n${jobsList}`;

    // 4. Call AI
    const aiResponse = await aiService.generateText(userPrompt, systemPrompt);
    
    // 5. Parse and Merge
    try {
      // Find JSON array in the response (robust to any extra conversational text)
      const jsonMatch = aiResponse.match(/\[.*\]/s);
      if (!jsonMatch) throw new Error("Could not parse AI response as JSON");
      
      const scoredJobs: {id: number, matchScore: number, fitReason: string}[] = JSON.parse(jsonMatch[0]);
      
      // Merge AI scores with actual job data
      const finalRecommendations = scoredJobs
        .map(sj => {
          const jobData = jobs.find(j => j.id === sj.id);
          if (!jobData) return null;
          return {
            ...jobData,
            matchScore: sj.matchScore,
            fitReason: sj.fitReason
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.matchScore - a.matchScore);

      return res.json({ recommendations: finalRecommendations });

    } catch (parseErr) {
      console.error("AI Response Parsing Error:", parseErr, "\nRaw Response:", aiResponse);
      // Fallback: Just return recent jobs if AI fails
      return res.json({ 
        recommendations: jobs.slice(0, 5).map(j => ({...j, matchScore: 70, fitReason: "Featured opportunity based on your profile."})) 
      });
    }

  } catch (err: any) {
    console.error("getJobRecommendations error:", err);
    return res.status(500).json({ message: "Error generating recommendations", error: err.message });
  }
};
