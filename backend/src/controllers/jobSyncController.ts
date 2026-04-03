import { Request, Response } from 'express';
import prisma from '../prisma';
import { aiService } from '../services/aiService';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get or create the admin user for posting auto-synced jobs
// ─────────────────────────────────────────────────────────────────────────────
async function getAdminUser() {
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) admin = await prisma.user.findFirst();
  return admin;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build EXP timestamp string (expires N days from now)
// ─────────────────────────────────────────────────────────────────────────────
function expiresIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `EXP:${d.toISOString()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC GOVT JOBS — Uses Gemini AI to generate realistic current Indian Govt job
// postings for UPSC, Banking, SSC, Railways. The AI is trained on up-to-date
// information and generates realistic pay scales, exam cycles & official URLs.
// ─────────────────────────────────────────────────────────────────────────────
export async function syncGovtJobs(adminId: number) {
  const currentYear = new Date().getFullYear();

  const prompt = `You are an expert on Indian government recruitment. Generate a JSON array of exactly 25 DISTINCT, REALISTIC Indian government job postings that are currently open or recently announced for ${currentYear}.

RULES:
- Mix categories: UPSC (5), Banking/PSU Banks (7), SSC (5), Railways (5), Defence/CRPF/BSF (3)
- Use REAL organization names (UPSC, SBI, Bank of Baroda, IBPS, SSC, RRB, ISRO, DRDO, etc.)
- Use REALISTIC pay scales in Indian Rupees per YEAR (not LPA)
- Use REAL official application URLs (upsc.gov.in, sbi.co.in, ibps.in, ssc.nic.in, indianrailways.gov.in, etc.)
- Each title must be unique and specific (e.g. "SBI Clerk 2025 – Junior Associates")
- Vary locations between All India, specific states, cities
- Write a compelling 2-3 sentence job description

Return ONLY a valid JSON array, no extra text. Format:
[
  {
    "title": "Job Title with Year",
    "company": "Official Organization Name",
    "location": "Location",
    "description": "2-3 sentence description",
    "role": "Govt-UPSC" | "Govt-Banking" | "Govt-SSC" | "Govt-Railway" | "Govt-Defence",
    "salaryMin": number (annual, INR),
    "salaryMax": number (annual, INR),
    "applyUrl": "https://official-url.gov.in/apply",
    "expiryDays": number (30-120 days open)
  }
]`;

  let jobs: any[] = [];
  try {
    const raw = await aiService.generateText(prompt);
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jobs = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('AI Govt Job generation failed, using static fallback:', err);
    jobs = getStaticGovtFallback(currentYear);
  }

  let count = 0;
  for (const job of jobs) {
    try {
      const existing = await prisma.job.findFirst({
        where: { title: job.title, company: job.company },
      });
      if (!existing) {
        await prisma.job.create({
          data: {
            title: job.title,
            company: job.company,
            location: job.location || 'All India',
            description: job.description,
            role: job.role || 'Govt-Misc',
            salaryMin: job.salaryMin || 350000,
            salaryMax: job.salaryMax || 1200000,
            workMode: 'OFFICE',
            workTime: expiresIn(job.expiryDays || 60),
            incentive: `EXT_URL:${job.applyUrl}`,
            postedById: adminId,
          },
        });
        count++;
      }
    } catch (err) {
      console.error(`Error inserting job "${job.title}":`, err);
    }
  }
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC PRIVATE JOBS — Fetches from Jooble API (free, requires JOOBLE_API_KEY)
// Jooble aggregates 1000s of real private job listings across India 
// ─────────────────────────────────────────────────────────────────────────────
export async function syncPrivateJobs(adminId: number) {
  const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

  if (!JOOBLE_API_KEY) {
    console.warn('⚠️  JOOBLE_API_KEY not set. Falling back to AI-generated private jobs.');
    return syncPrivateJobsViaAI(adminId);
  }

  const searchTerms = [
    { keywords: 'Software Engineer', location: 'India' },
    { keywords: 'Data Analyst', location: 'India' },
    { keywords: 'Product Manager', location: 'India' },
    { keywords: 'Marketing Manager', location: 'India' },
    { keywords: 'Business Analyst', location: 'India' },
  ];

  let count = 0;
  for (const term of searchTerms) {
    try {
      const response = await axios.post(
        `https://jooble.org/api/${JOOBLE_API_KEY}`,
        { keywords: term.keywords, location: term.location, page: 1 },
        { timeout: 10000 }
      );

      const listings: any[] = response.data?.jobs || [];
      for (const listing of listings.slice(0, 10)) {
        const title = listing.title?.trim();
        const company = listing.company?.trim() || 'Private Company';
        if (!title) continue;

        const existing = await prisma.job.findFirst({
          where: { title, company },
        });
        if (!existing) {
          await prisma.job.create({
            data: {
              title,
              company,
              location: listing.location || 'India',
              description: listing.snippet || `Exciting opportunity at ${company}. Apply now on the official website.`,
              role: 'Private-External',
              salaryMin: null,
              salaryMax: null,
              workMode: 'HYBRID',
              workTime: expiresIn(30),
              incentive: `EXT_URL:${listing.link}`,
              postedById: adminId,
            },
          });
          count++;
        }
      }
    } catch (err) {
      console.error(`Jooble fetch error for "${term.keywords}":`, err);
    }
  }
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK: AI-generate private jobs when no Jooble key is set
// ─────────────────────────────────────────────────────────────────────────────
async function syncPrivateJobsViaAI(adminId: number) {
  const currentYear = new Date().getFullYear();
  const prompt = `Generate a JSON array of 20 DISTINCT, REALISTIC private sector job postings in India for ${currentYear}.

Include top companies: Infosys, TCS, Wipro, Accenture, Google India, Amazon India, Microsoft India, Flipkart, Zomato, Razorpay, CRED, PhonePe, Meesho, Byju's, Swiggy, Ola, Paytm, HCL, Tech Mahindra, Capgemini.

Vary roles: Software Engineer, Data Scientist, Product Manager, UX Designer, DevOps, Cloud Architect, Business Analyst, HR Manager, Marketing Lead, Sales Executive.

Return ONLY valid JSON array:
[
  {
    "title": "Specific Role Title",
    "company": "Company Name",
    "location": "City, India",
    "description": "2-3 sentence job description",
    "salaryMin": number (annual INR),
    "salaryMax": number (annual INR),
    "applyUrl": "https://company-careers-page.com",
    "workMode": "OFFICE" | "REMOTE" | "HYBRID"
  }
]`;

  let jobs: any[] = [];
  try {
    const raw = await aiService.generateText(prompt);
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) jobs = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('AI Private Job generation failed:', err);
    return 0;
  }

  let count = 0;
  for (const job of jobs) {
    try {
      const existing = await prisma.job.findFirst({
        where: { title: job.title, company: job.company },
      });
      if (!existing) {
        await prisma.job.create({
          data: {
            title: job.title,
            company: job.company,
            location: job.location || 'India',
            description: job.description,
            role: 'Private-External',
            salaryMin: job.salaryMin || null,
            salaryMax: job.salaryMax || null,
            workMode: (job.workMode || 'HYBRID') as any,
            workTime: expiresIn(30),
            incentive: `EXT_URL:${job.applyUrl}`,
            postedById: adminId,
          },
        });
        count++;
      }
    } catch (err) {
      console.error(`Error inserting private job "${job.title}":`, err);
    }
  }
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC FALLBACK — Used when AI is unavailable
// ─────────────────────────────────────────────────────────────────────────────
function getStaticGovtFallback(year: number) {
  return [
    { title: `UPSC Civil Services Examination ${year}`, company: 'Union Public Service Commission', location: 'All India', description: 'The Civil Services Examination is a national competitive examination for IAS, IPS, and IFS recruitment. Applications are invited from eligible graduates across India.', role: 'Govt-UPSC', salaryMin: 700000, salaryMax: 2500000, applyUrl: 'https://upsc.gov.in/examinations/active-examinations', expiryDays: 90 },
    { title: `UPSC Engineering Services Examination ${year}`, company: 'Union Public Service Commission', location: 'All India', description: 'Recruitment for engineering posts in Central Government departments. Eligible candidates with engineering degrees may apply online.', role: 'Govt-UPSC', salaryMin: 560000, salaryMax: 1780000, applyUrl: 'https://upsc.gov.in', expiryDays: 75 },
    { title: `SBI PO ${year} – Probationary Officer`, company: 'State Bank of India', location: 'All India', description: 'SBI invites applications for 2000+ Probationary Officers. Successful candidates will work across SBI branches in India managing banking operations.', role: 'Govt-Banking', salaryMin: 550000, salaryMax: 1000000, applyUrl: 'https://sbi.co.in/web/careers', expiryDays: 45 },
    { title: `SBI Clerk ${year} – Junior Associates`, company: 'State Bank of India', location: 'All India', description: 'State Bank of India is hiring Junior Associates (Customer Support & Sales) across its branches. Candidates with 60% in graduation may apply.', role: 'Govt-Banking', salaryMin: 320000, salaryMax: 550000, applyUrl: 'https://sbi.co.in/web/careers', expiryDays: 45 },
    { title: `IBPS PO ${year} – Probationary Officer`, company: 'Institute of Banking Personnel Selection', location: 'All India', description: 'IBPS announces PO recruitment for participating public sector banks. Written exam followed by interview for final selection.', role: 'Govt-Banking', salaryMin: 480000, salaryMax: 900000, applyUrl: 'https://www.ibps.in', expiryDays: 60 },
    { title: `IBPS Clerk ${year} – Clerical Cadre`, company: 'Institute of Banking Personnel Selection', location: 'All India', description: 'IBPS invites online applications for Clerical Cadre posts in multiple public sector banks across India.', role: 'Govt-Banking', salaryMin: 290000, salaryMax: 500000, applyUrl: 'https://www.ibps.in', expiryDays: 60 },
    { title: `Bank of Baroda SO ${year} – Specialist Officers`, company: 'Bank of Baroda', location: 'All India', description: 'Bank of Baroda is recruiting Specialist Officers in IT, Risk, Finance, and HR domains. Apply online at bankofbaroda.in.', role: 'Govt-Banking', salaryMin: 520000, salaryMax: 950000, applyUrl: 'https://www.bankofbaroda.in/careers', expiryDays: 40 },
    { title: `SSC CGL ${year} – Combined Graduate Level`, company: 'Staff Selection Commission', location: 'All India', description: "SSC CGL is conducted for Group B and Group C posts in various Government Ministries. Graduate candidates from any stream may apply.", role: 'Govt-SSC', salaryMin: 450000, salaryMax: 1200000, applyUrl: 'https://ssc.nic.in', expiryDays: 80 },
    { title: `SSC CHSL ${year} – Combined Higher Secondary Level`, company: 'Staff Selection Commission', location: 'All India', description: 'SSC CHSL recruitment for LDC, DEO, and Postal/Sorting Assistant posts. Candidates with 10+2 qualification may apply.', role: 'Govt-SSC', salaryMin: 250000, salaryMax: 480000, applyUrl: 'https://ssc.nic.in', expiryDays: 80 },
    { title: `SSC CPO ${year} – Sub-Inspector in CAPF`, company: 'Staff Selection Commission', location: 'All India', description: 'SSC CPO recruitment for Sub-Inspector posts in Central Armed Police Forces. Physical and written tests conducted in phases.', role: 'Govt-SSC', salaryMin: 400000, salaryMax: 750000, applyUrl: 'https://ssc.nic.in', expiryDays: 60 },
    { title: `SSC GD Constable ${year}`, company: 'Staff Selection Commission', location: 'All India', description: 'SSC General Duty Constable Exam for BSF, CRPF, SSB, CISF, and NIA. Eligible candidates with 10th pass may apply.', role: 'Govt-SSC', salaryMin: 220000, salaryMax: 380000, applyUrl: 'https://ssc.nic.in', expiryDays: 70 },
    { title: `SSC MTS ${year} – Multi Tasking Staff`, company: 'Staff Selection Commission', location: 'All India', description: "SSC MTS recruitment for Non-Technical Multi-Tasking Staff in offices of the Government of India. Minimum qualification is 10th pass.", role: 'Govt-SSC', salaryMin: 180000, salaryMax: 320000, applyUrl: 'https://ssc.nic.in', expiryDays: 75 },
    { title: `RRB NTPC ${year} – Non-Technical Popular Categories`, company: 'Railway Recruitment Board', location: 'All India', description: 'Railway Recruitment Board invites applications for NTPC posts including Traffic Assistant, Goods Guard, and Junior Account Assistant.', role: 'Govt-Railway', salaryMin: 350000, salaryMax: 680000, applyUrl: 'https://www.rrbcdg.gov.in', expiryDays: 90 },
    { title: `RRB Group D ${year} – Track Maintainer & Others`, company: 'Railway Recruitment Board', location: 'All India', description: 'Massive recruitment drive for Group D posts in Indian Railways. Minimum 10th pass eligibility for Track Maintainer, Helper, and Assistant posts.', role: 'Govt-Railway', salaryMin: 180000, salaryMax: 320000, applyUrl: 'https://www.rrbcdg.gov.in', expiryDays: 90 },
    { title: `RRB ALP ${year} – Assistant Loco Pilot`, company: 'Railway Recruitment Board', location: 'All India', description: 'RRB ALP recruitment for Assistant Loco Pilot positions across railway zones in India. ITI/Diploma holders in relevant trades may apply.', role: 'Govt-Railway', salaryMin: 290000, salaryMax: 480000, applyUrl: 'https://www.rrbcdg.gov.in', expiryDays: 75 },
    { title: `RRB JE ${year} – Junior Engineer`, company: 'Railway Recruitment Board', location: 'All India', description: 'RRB Junior Engineer recruitment for Civil, Electrical, IT, and Signal posts across Indian Railways. Engineering diploma/degree required.', role: 'Govt-Railway', salaryMin: 380000, salaryMax: 650000, applyUrl: 'https://www.rrbcdg.gov.in', expiryDays: 70 },
    { title: `RRC Western Railway ${year} – Apprentice`, company: 'Western Railway', location: 'Mumbai, Maharashtra', description: 'Western Railway invites applications for Trade Apprentice posts under the Apprentices Act, 1961. ITI qualified candidates preferred.', role: 'Govt-Railway', salaryMin: 150000, salaryMax: 250000, applyUrl: 'https://www.wr.indianrailways.gov.in', expiryDays: 45 },
    { title: `CRPF HC Min ${year} – Head Constable Ministerial`, company: 'Central Reserve Police Force', location: 'All India', description: 'CRPF invites applications for Head Constable (Ministerial) positions. Successful candidates will be posted across India in CRPF administrative offices.', role: 'Govt-Defence', salaryMin: 250000, salaryMax: 430000, applyUrl: 'https://crpf.gov.in/vacancies.htm', expiryDays: 50 },
    { title: `BSF HC RO ${year} – Head Constable Radio Operator`, company: 'Border Security Force', location: 'All India', description: 'BSF recruitment for Head Constable (Radio Operator/Radio Mechanic) posts. Candidates who have passed Class 12 with Physics and Maths are eligible.', role: 'Govt-Defence', salaryMin: 240000, salaryMax: 410000, applyUrl: 'https://rectt.bsf.gov.in', expiryDays: 55 },
    { title: `CISF Constable Fire ${year}`, company: 'Central Industrial Security Force', location: 'All India', description: 'CISF is recruiting Constable/Fire posts through physical and written tests. Male candidates aged 18-23 with Class 10 pass are eligible.', role: 'Govt-Defence', salaryMin: 200000, salaryMax: 350000, applyUrl: 'https://cisfrectt.gov.in', expiryDays: 60 },
    { title: `NIACL AO ${year} – Administrative Officers`, company: 'New India Assurance Company Limited', location: 'All India', description: 'NIACL is recruiting Administrative Officers in Scale I for Generalist and Specialist (IT, Legal, Finance) streams. Graduates may apply online.', role: 'Govt-Banking', salaryMin: 480000, salaryMax: 850000, applyUrl: 'https://newindia.co.in', expiryDays: 40 },
    { title: `LIC AAO ${year} – Assistant Administrative Officer`, company: 'Life Insurance Corporation of India', location: 'All India', description: 'LIC is recruiting Assistant Administrative Officers (Generalist/IT) across its offices in India. Candidates with graduation qualify for written test.', role: 'Govt-Banking', salaryMin: 520000, salaryMax: 1000000, applyUrl: 'https://licindia.in/Careers', expiryDays: 50 },
    { title: `UPSC NDA ${year} – National Defence Academy`, company: 'Union Public Service Commission', location: 'All India', description: 'UPSC NDA exam for admission to Army, Navy and Air Force wings of the NDA. Male candidates who have passed 10+2 with Physics and Maths are eligible.', role: 'Govt-UPSC', salaryMin: 560000, salaryMax: 1800000, applyUrl: 'https://upsc.gov.in', expiryDays: 60 },
    { title: `UPSC CDS ${year} – Combined Defence Services`, company: 'Union Public Service Commission', location: 'All India', description: 'UPSC conducts CDS twice a year for recruitment to the Indian Military Academy, Officers Training Academy, Indian Naval Academy, and Air Force Academy.', role: 'Govt-UPSC', salaryMin: 600000, salaryMax: 2000000, applyUrl: 'https://upsc.gov.in', expiryDays: 65 },
    { title: `Punjab National Bank PO ${year}`, company: 'Punjab National Bank', location: 'All India', description: 'PNB is recruiting Probationary Officers for its banking operations. The selection is through an online examination followed by a group discussion and interview.', role: 'Govt-Banking', salaryMin: 480000, salaryMax: 920000, applyUrl: 'https://pnbindia.in/Career.aspx', expiryDays: 45 },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEAN EXPIRED JOBS — Removes auto-synced external jobs that have expired
// ─────────────────────────────────────────────────────────────────────────────
export const cleanExpiredJobs = async (req: Request, res: Response) => {
  try {
    // Find all external jobs (those using EXP: workTime format)
    const externalJobs = await prisma.job.findMany({
      where: {
        workTime: { startsWith: 'EXP:' },
      },
      select: { id: true, workTime: true, title: true },
    });

    const now = new Date();
    const expiredIds: number[] = [];

    for (const job of externalJobs) {
      const expStr = job.workTime?.replace('EXP:', '');
      if (expStr) {
        const expDate = new Date(expStr);
        if (expDate < now) {
          expiredIds.push(job.id);
        }
      }
    }

    if (expiredIds.length > 0) {
      await prisma.job.deleteMany({ where: { id: { in: expiredIds } } });
    }

    return res.json({
      message: `Cleaned ${expiredIds.length} expired jobs.`,
      removedIds: expiredIds,
    });
  } catch (err: any) {
    console.error('cleanExpiredJobs error:', err);
    return res.status(500).json({ message: 'Error cleaning jobs', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SYNC ENDPOINT — Cleans expired jobs first, then syncs fresh content
// ─────────────────────────────────────────────────────────────────────────────
export const syncExternalJobs = async (req: Request, res: Response) => {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return res.status(500).json({ message: 'No admin user found to assign jobs to.' });
    }

    // Step 1: Clean expired listings
    const allExternal = await prisma.job.findMany({
      where: { workTime: { startsWith: 'EXP:' } },
      select: { id: true, workTime: true },
    });

    const now = new Date();
    const expiredIds = allExternal
      .filter((j) => {
        const d = new Date(j.workTime!.replace('EXP:', ''));
        return d < now;
      })
      .map((j) => j.id);

    if (expiredIds.length > 0) {
      await prisma.job.deleteMany({ where: { id: { in: expiredIds } } });
      console.log(`🗑️  Removed ${expiredIds.length} expired jobs`);
    }

    // Step 2: Sync Govt Jobs via AI
    console.log('🤖 Generating Govt jobs via AI...');
    const govtCount = await syncGovtJobs(adminUser.id);

    // Step 3: Sync Private Jobs
    console.log('🏢 Fetching Private jobs...');
    const privateCount = await syncPrivateJobs(adminUser.id);

    return res.json({
      message: `Sync complete! Added ${govtCount} govt jobs, ${privateCount} private jobs. Removed ${expiredIds.length} expired listings.`,
      stats: { govtAdded: govtCount, privateAdded: privateCount, expired: expiredIds.length },
    });
  } catch (err: any) {
    console.error('syncExternalJobs error:', err);
    return res.status(500).json({ message: 'Error during sync', error: err.message });
  }
};
