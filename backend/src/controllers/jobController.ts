// backend/src/controllers/jobController.ts
import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '@prisma/client';

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
    if (!currentUser) return res.status(401).json({ message: 'Unauthorized' });
    if (![Role.RECRUITER, Role.ADMIN].includes(currentUser.role)) {
      return res.status(403).json({ message: 'Only recruiters/admin can create jobs' });
    }

    const { title, company, location, description, salaryMin, salaryMax, workMode, role } = req.body;

    if (!title || !company || !location || !description) {
      return res.status(400).json({ message: 'title, company, location and description are required' });
    }

    const min = parseOptionalNumber(salaryMin);
    const max = parseOptionalNumber(salaryMax);

    if (min !== null && max !== null && min > max) {
      return res.status(400).json({ message: 'salaryMin cannot be greater than salaryMax' });
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
      },
    });

    return res.status(201).json({ message: 'Job created successfully', job });
  } catch (err: any) {
    console.error('createJob error:', err);
    return res.status(500).json({ message: 'Error creating job', error: err.message });
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
