// backend/src/services/emailService.ts
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { Resend } from "resend";

// ----------------- ENV -----------------
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "JobRun <no-reply@jobrun.in>";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:5000";

// ----------------- LOGGING -----------------
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function logLine(line: string) {
  const file = path.join(logsDir, "email.log");
  const ts = new Date().toISOString();
  const final = `[${ts}] ${line}\n`;
  try { fs.appendFileSync(file, final); } catch {}
  console.log(final.trim());
}

// ----------------- RESEND ONLY -----------------
if (!RESEND_API_KEY) logLine("❌ ERROR: RESEND_API_KEY is missing!");

const resend = new Resend(RESEND_API_KEY);
logLine(`✅ Resend Ready (from=${FROM_EMAIL})`);

// ----------------- LOAD TEMPLATES -----------------
const templatesDir = path.join(__dirname, "..", "emails", "templates");
const templates: Record<string, Handlebars.TemplateDelegate> = {};

logLine(`EMAIL BASES -> BACKEND_BASE_URL=${BACKEND_BASE_URL} FRONTEND_BASE_URL=${FRONTEND_BASE_URL}`);

function loadTemplates() {
  if (!fs.existsSync(templatesDir)) {
    logLine(`❌ Templates directory not found: ${templatesDir}`);
    return;
  }

  for (const file of fs.readdirSync(templatesDir)) {
    if (file.endsWith(".hbs")) {
      const name = path.basename(file, ".hbs");
      const content = fs.readFileSync(path.join(templatesDir, file), "utf8");
      templates[name] = Handlebars.compile(content);
      logLine(`✅ Loaded template "${name}"`);
    }
  }
}
loadTemplates();

// ----------------- SEND EMAIL -----------------
async function sendEmailTemplate(to: string, subject: string, template: string, context: any) {
  let html = templates[template]
    ? templates[template](context)
    : `<h3>${subject}</h3><pre>${JSON.stringify(context, null, 2)}</pre>`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    logLine(`❌ SEND ERROR: ${error.message}`);
    throw new Error(error.message);
  }

  logLine(`✅ SENT to=${to} subject="${subject}" id=${data?.id}`);
  return data;
}

// ----------------- QUEUE SYSTEM -----------------
type EmailJob = {
  id: string;
  to: string;
  subject: string;
  template: string;
  context: object;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: number;
};

const emailQueue: EmailJob[] = [];
let workerRunning = false;

function enqueueEmail({ to, subject, template, context, maxAttempts = 3 }: any) {
  const job: EmailJob = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    to,
    subject,
    template,
    context,
    attempts: 0,
    maxAttempts,
    nextAttemptAt: Date.now(),
  };

  emailQueue.push(job);
  logLine(`📬 QUEUED id=${job.id} to=${job.to}`);

  if (!workerRunning) process.nextTick(workerLoop);
  return job.id;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function workerLoop() {
  workerRunning = true;

  while (emailQueue.length > 0) {
    const job = emailQueue[0];

    if (job.nextAttemptAt > Date.now()) {
      await sleep(400);
      continue;
    }

    try {
      job.attempts++;
      await sendEmailTemplate(job.to, job.subject, job.template, job.context);
      emailQueue.shift();
    } catch (err: any) {
      logLine(`❌ ERROR attempt=${job.attempts} to=${job.to}: ${err.message}`);

      if (job.attempts >= job.maxAttempts) {
        logLine(`💀 GAVE UP id=${job.id}`);
        emailQueue.shift();
      } else {
        job.nextAttemptAt = Date.now() + Math.pow(2, job.attempts) * 1000;
      }
    }
  }

  workerRunning = false;
}

// ----------------- PUBLIC EMAIL FUNCTIONS -----------------

export function sendWelcomeEmail(to: string, name?: string) {
  return enqueueEmail({
    to,
    subject: "Welcome to JobRun",
    template: "welcome",
    context: { name, baseUrl: FRONTEND_BASE_URL },
  });
}

export function sendApplicantEmail(to: string, jobTitle: string, resumeUrl?: string) {
  const fullUrl = resumeUrl ? BACKEND_BASE_URL + resumeUrl : null;

  return enqueueEmail({
    to,
    subject: `Application Received — ${jobTitle}`,
    template: "applicantReceived",
    context: { jobTitle, fullResumeUrl: fullUrl },
  });
}

export function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  return enqueueEmail({
    to,
    subject: "Reset your JobRun password",
    template: "passwordReset",
    context: { name, resetUrl },
  });
}

export function sendRecruiterNewApplicationEmail(to: string, jobTitle: string, applicantName: string, applicantEmail: string, resumeUrl?: string) {
  const fullUrl = resumeUrl ? BACKEND_BASE_URL + resumeUrl : null;

  return enqueueEmail({
    to,
    subject: `New Application — ${jobTitle}`,
    template: "recruiterNewApplication",
    context: { jobTitle, applicantName, applicantEmail, fullResumeUrl: fullUrl },
  });
}

export function sendStatusUpdateEmail(applicantEmail: string, applicantName: string, jobTitle: string, status: string, recruiterEmail?: string, note?: string) {
  return enqueueEmail({
    to: applicantEmail,
    subject: `Your application status for ${jobTitle} is now ${status}`,
    template: "statusUpdate",
    context: { applicantName, jobTitle, status, recruiterEmail, note },
  });
}

// ✅ THE MISSING ONE — REQUIRED BY YOUR CONTROLLER
export function sendRecruiterStatusUpdateEmail(recruiterEmail: string, recruiterName: string, jobTitle: string, applicantName: string, applicantEmail: string, status: string, note?: string) {
  return enqueueEmail({
    to: recruiterEmail,
    subject: `Applicant status updated for ${jobTitle}`,
    template: "recruiterStatusUpdate",
    context: { recruiterName, jobTitle, applicantName, applicantEmail, status, note },
  });
}

// Test endpoint helper
export async function sendTestEmailNow(to: string) {
  return sendEmailTemplate(to, "Test Email", "statusUpdate", { hello: "world" });
}
