// backend/src/services/emailService.ts
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

// ----------------- ENV -----------------
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 2525;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Job Portal <no-reply@example.local>';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const BACKEND_BASE_URL  = process.env.BACKEND_BASE_URL  || 'http://localhost:5000';

// ----------------- LOGGING -----------------
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function logLine(line: string) {
  const file = path.join(logsDir, 'email.log');
  const ts = new Date().toISOString();
  const final = `[${ts}] ${line}\n`;
  try { fs.appendFileSync(file, final); } catch { /* noop */ }
  console.log(final.trim());
}

// ----------------- TRANSPORT -----------------
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

// Optional: verify at boot
transporter.verify()
  .then(() => logLine(`SMTP READY (host=${SMTP_HOST}, port=${SMTP_PORT}, user=${SMTP_USER})`))
  .catch((e) => logLine(`SMTP VERIFY FAILED: ${e?.message || e}`));

// ----------------- TEMPLATES -----------------
const templatesDir = path.join(process.cwd(), 'emails', 'templates');
const templates: Record<string, Handlebars.TemplateDelegate> = {};

function loadTemplates() {
  try {
    if (!fs.existsSync(templatesDir)) {
      logLine(`Templates folder not found: ${templatesDir} — fallback simple HTML will be used.`);
      return;
    }
    const files = fs.readdirSync(templatesDir);
    for (const f of files) {
      if (f.endsWith('.hbs')) {
        const name = path.basename(f, '.hbs'); // base name must match what you call
        const content = fs.readFileSync(path.join(templatesDir, f), 'utf8');
        templates[name] = Handlebars.compile(content);
        logLine(`Loaded email template "${name}"`);
      }
    }
  } catch (err: any) {
    logLine(`Failed to load templates: ${err?.message || err}`);
  }
}
loadTemplates();

async function sendEmailTemplate(to: string, subject: string, templateName: string, context: object) {
  let html: string;
  const tpl = templates[templateName];

  if (tpl) {
    html = tpl(context);
  } else {
    // legacy fallback one-off (keep if you had older filenames)
    const fallbackName =
      templateName === 'recruiterNewApplication' && templates['applicationReceived']
        ? 'applicationReceived'
        : null;

    if (fallbackName) {
      html = templates[fallbackName](context);
      logLine(`Template "${templateName}" not found; used fallback "${fallbackName}".`);
    } else {
      html = `<html><body><h3>${subject}</h3><pre>${JSON.stringify(context, null, 2)}</pre></body></html>`;
      logLine(`Template "${templateName}" not found; sending fallback HTML.`);
    }
  }

  const info = await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
  logLine(`SENT to=${to} subject="${subject}" messageId=${(info as any)?.messageId ?? 'n/a'}`);
  return info;
}

// ----------------- QUEUE -----------------
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
let emailWorkerRunning = false;

function enqueueEmail(args: {
  to: string;
  subject: string;
  template: string;
  context: object;
  maxAttempts?: number;
}) {
  const job: EmailJob = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    to: args.to,
    subject: args.subject,
    template: args.template,
    context: args.context,
    attempts: 0,
    maxAttempts: args.maxAttempts ?? 3,
    nextAttemptAt: Date.now(),
  };
  emailQueue.push(job);
  logLine(`ENQUEUED id=${job.id} to=${job.to} subj="${job.subject}" template="${job.template}"`);
  if (!emailWorkerRunning) process.nextTick(emailWorker);
  return job.id;
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function emailWorker() {
  emailWorkerRunning = true;
  while (emailQueue.length > 0) {
    const job = emailQueue[0];
    const now = Date.now();

    if (job.nextAttemptAt > now) {
      await sleep(Math.min(1000, job.nextAttemptAt - now));
      continue;
    }

    try {
      job.attempts += 1;
      await sendEmailTemplate(job.to, job.subject, job.template, job.context);
      emailQueue.shift();
    } catch (err: any) {
      logLine(`ERROR attempt=${job.attempts} to=${job.to} subj="${job.subject}" err=${err?.message || err}`);
      if (job.attempts >= job.maxAttempts) {
        logLine(`GAVE UP id=${job.id} to=${job.to} subj="${job.subject}"`);
        emailQueue.shift();
      } else {
        job.nextAttemptAt = Date.now() + Math.pow(2, job.attempts) * 1000;
      }
    }
  }
  emailWorkerRunning = false;
}

// ----------------- PUBLIC HELPERS -----------------

/** Welcome email on registration */
export function sendWelcomeEmail(to: string, name?: string) {
  return enqueueEmail({
    to,
    subject: `Welcome to JobNow`,
    template: 'welcome', // emails/templates/welcome.hbs
    context:  { name, baseUrl: FRONTEND_BASE_URL }, 
  });
}

/** Email to the applicant: "We received your application" */
export function sendApplicantEmail(to: string, jobTitle: string, resumeUrl?: string) {
  const fullResumeUrl = resumeUrl
    ? `${BACKEND_BASE_URL}${resumeUrl}`
    : null;

  return enqueueEmail({
    to,
    subject: `Application Received — ${jobTitle}`,
    template: 'applicantReceived',
    context: { jobTitle, resumeUrl, fullResumeUrl }, // pass both if you like
  });
}

/** Email to the recruiter who posted the job: "You got a new application" */
export function sendRecruiterNewApplicationEmail(
  to: string,
  jobTitle: string,
  applicantName: string,
  applicantEmail: string,
  resumeUrl?: string
) {
  const fullResumeUrl = resumeUrl
    ? `${process.env.FRONTEND_BASE_URL || 'http://localhost:5000'}${resumeUrl}`
    : null;

  return enqueueEmail({
    to,
    subject: `New Application — ${jobTitle}`,
    template: 'recruiterNewApplication', // emails/templates/recruiterNewApplication.hbs
    context: { jobTitle, applicantName, applicantEmail, fullResumeUrl },
    maxAttempts: 3
  });
}

/** Email to applicant on status changes */
export function sendStatusUpdateEmail(to: string, jobTitle: string, status: string, note?: string) {
  return enqueueEmail({
    to,
    subject: `Application Update — ${jobTitle}`,
    template: 'statusUpdate', // emails/templates/statusUpdate.hbs
    context: { jobTitle, status, note },
  });
}

// Optional manual test
export async function sendTestEmailNow(to: string, subject = 'Test Email', body: { hello: string }) {
  return sendEmailTemplate(to, subject, 'statusUpdate', body);
}
