// backend/src/controllers/jobController.ts
import { Request, Response } from 'express';
import prisma from '../prisma';

/**
 * Create Job
 */
export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, company, location, description, salaryMin, salaryMax, workMode, role } = req.body;
    const postedById = (req as any).user?.id;

    if (!title || !company || !location || !description) {
      return res.status(400).json({ message: 'title, company, location and description are required' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        company,
        location,
        description,
        postedById,
        salaryMin: salaryMin !== undefined && salaryMin !== null ? Number(salaryMin) : null,
        salaryMax: salaryMax !== undefined && salaryMax !== null ? Number(salaryMax) : null,
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
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const sortOrder = (sort === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const where: any = {};

    const searchTerm = (title as string) || (search as string) || '';
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { company: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (location) where.location = { contains: (location as string), mode: 'insensitive' };
    if (company) where.company = { contains: (company as string), mode: 'insensitive' };
    if (role) where.role = role;
    if (workMode) where.workMode = workMode as any;

    // salary overlap logic
    const minS = minSalary !== undefined && minSalary !== null ? Number(minSalary) : undefined;
    const maxS = maxSalary !== undefined && maxSalary !== null ? Number(maxSalary) : undefined;
    if (minS !== undefined || maxS !== undefined) {
      where.AND = where.AND || [];
      if (minS !== undefined) {
        where.AND.push({ salaryMax: { gte: minS } });
      }
      if (maxS !== undefined) {
        where.AND.push({ salaryMin: { lte: maxS } });
      }
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
    const job = await prisma.job.findUnique({
      where: { id },
      include: { postedBy: true, applications: true },
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    return res.json(job);
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
