import { Request, Response } from 'express';
import prisma from '../prisma';

export const syncExternalJobs = async (req: Request, res: Response) => {
  try {
    // Verify there is an admin user to map these to, or fallback to the first user
    let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
        adminUser = await prisma.user.findFirst(); // fallback
    }

    if (!adminUser) {
        return res.status(500).json({ message: "No user found to assign these jobs to." });
    }

    // Array of mock external jobs showcasing different categories using our Zero-Migration strategy
    const mockJobs = [
      {
        title: "UPSC Civil Services Examination 2024",
        company: "Union Public Service Commission",
        location: "All India",
        description: "The Civil Services Examination (CSE) is a national competitive examination in India conducted by the Union Public Service Commission for recruitment to higher Civil Services of the Government of India, including the Indian Administrative Service, Indian Foreign Service, and Indian Police Service.",
        role: "Govt-UPSC",
        salaryMin: 700000,
        salaryMax: 1500000,
        workMode: "OFFICE",
        workTime: "Full-Time",
        incentive: "EXT_URL:https://upsc.gov.in/apply",
      },
      {
        title: "SBI Probationary Officer (PO) 2024",
        company: "State Bank of India (SBI)",
        location: "All India",
        description: "SBI is recruiting Probationary Officers. Candidates will undergo training to handle various banking operations. This is a highly sought-after government bank job offering job security and excellent growth prospects.",
        role: "Govt-Banking",
        salaryMin: 600000,
        salaryMax: 1000000,
        workMode: "OFFICE",
        workTime: "Full-Time",
        incentive: "EXT_URL:https://sbi.co.in/web/careers",
      },
      {
        title: "SSC CGL (Combined Graduate Level)",
        company: "Staff Selection Commission",
        location: "New Delhi",
        description: "Staff Selection Commission will hold Combined Graduate Level Examination, 2024 for filling up of various Group 'B' and Group 'C' posts in different Ministries/ Departments/ Organizations of Government of India and various Constitutional Bodies/ Statutory Bodies/ Tribunals, etc.",
        role: "Govt-SSC",
        salaryMin: 500000,
        salaryMax: 1200000,
        workMode: "OFFICE",
        workTime: "Full-Time",
        incentive: "EXT_URL:https://ssc.nic.in/Portal/Apply",
      },
      {
        title: "Software Engineer III - React / Node.js",
        company: "Google India",
        location: "Bangalore",
        description: "As a Software Engineer at Google, you will work on a specific project critical to Google’s needs with opportunities to switch teams and projects as you and our fast-paced business grow and evolve. We need our engineers to be versatile, display leadership qualities and be enthusiastic.",
        role: "Private-External",
        salaryMin: 3000000,
        salaryMax: 5000000,
        workMode: "HYBRID",
        workTime: "Full-Time",
        incentive: "EXT_URL:https://careers.google.com/jobs/results/",
      },
      {
        title: "RRB NTPC Recruitment 2024",
        company: "Indian Railways",
        location: "All India",
        description: "Railway Recruitment Board invites applications from eligible candidates for the posts of Non-Technical Popular Categories (NTPC). Don't miss this opportunity to secure a career with the Indian Railways.",
        role: "Govt-Railway",
        salaryMin: 350000,
        salaryMax: 600000,
        workMode: "OFFICE",
        workTime: "Full-Time",
        incentive: "EXT_URL:https://indianrailways.gov.in/",
      }
    ];

    let count = 0;
    for (const jobData of mockJobs) {
      // Check if job with this exact title and company exists
      const existing = await prisma.job.findFirst({
        where: { title: jobData.title, company: jobData.company }
      });

      if (!existing) {
        await prisma.job.create({
          data: {
            ...jobData,
            workMode: jobData.workMode as any,
            postedById: adminUser.id,
          }
        });
        count++;
      }
    }

    return res.json({ message: `Successfully synced ${count} external jobs.` });
  } catch (err: any) {
    console.error("syncExternalJobs error:", err);
    return res.status(500).json({ message: "Error syncing jobs", error: err.message });
  }
};
