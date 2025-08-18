// frontend/src/pages/JobDetail.tsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Box, Paper, Stack, Typography, Chip, Button, Card, CardContent,
  TextField, Snackbar, Alert, InputAdornment, IconButton, Divider
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LinkIcon from "@mui/icons-material/Link";
import { api } from "../api";
import { useAuth } from "../auth/AuthProvider";

type Application = {
  id: number;
  userId: number;
  jobId: number;
  resumeUrl: string;
  status: string;
  createdAt: string;
  user?: { id: number; name: string; email: string };
};

type Job = {
  id: number;
  title: string;
  description: string;
  company: string;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  workMode?: string | null;
  role?: string | null;
  postedBy?: { id: number; name: string; email: string };
  applications?: Application[];
};

function parseIdFromSlug(slug?: string) {
  if (!slug) return NaN;
  return Number(String(slug).split("_")[0]);
}

export default function JobDetail() {
  const { idSlug } = useParams<{ idSlug: string }>();
  const jobId = parseIdFromSlug(idSlug);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [toast, setToast] = useState<{ open: boolean; severity?: "success" | "error" | "info"; message: string }>({ open: false, message: "" });

  useEffect(() => {
    if (!jobId || Number.isNaN(jobId)) return;
    loadJob();
  }, [idSlug]);

  async function loadJob() {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${jobId}`);
      setJob(res.data);
    } catch (err: any) {
      console.error("Failed to load job:", err);
      setToast({ open: true, severity: "error", message: "Failed to load job details." });
    } finally {
      setLoading(false);
    }
  }

  const userAlreadyApplied = !!job?.applications?.some((a) => a.userId === user?.id);

  function formatCurrency(v?: number | null) {
    return typeof v === "number" ? `₹${v.toLocaleString()}` : "—";
  }

  async function handleApplyByUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setToast({ open: true, severity: "info", message: "Please login to apply." });
      navigate("/login");
      return;
    }
    if (user.role !== "USER") {
      setToast({ open: true, severity: "error", message: "Only applicants can apply." });
      return;
    }
    if (!resumeUrl || !/^https?:\/\//i.test(resumeUrl)) {
      setToast({ open: true, severity: "error", message: "Please enter a valid URL (starting with http/https)." });
      return;
    }

    try {
      await api.post(`/applications/jobs/${jobId}/apply`, { resumeUrl });
      setToast({ open: true, severity: "success", message: "Application submitted — recruiter will be notified." });
      setResumeUrl("");
      loadJob();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to apply.";
      setToast({ open: true, severity: "error", message: msg });
    }
  }

  async function handleFileUploadApply() {
    if (!user) {
      setToast({ open: true, severity: "info", message: "Please login to apply." });
      navigate("/login");
      return;
    }
    if (user.role !== "USER") {
      setToast({ open: true, severity: "error", message: "Only applicants can apply." });
      return;
    }
    if (!file) {
      setToast({ open: true, severity: "error", message: "Please choose a file (PDF)." });
      return;
    }
    if (file.type !== "application/pdf") {
      setToast({ open: true, severity: "error", message: "Only PDF files are allowed." });
      return;
    }

    try {
      const form = new FormData();
      form.append("resume", file);
      await api.post(`/applications/jobs/${jobId}/apply-file`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setToast({ open: true, severity: "success", message: "File uploaded & application submitted." });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadJob();
    } catch (err: any) {
      console.error("File apply error", err);
      const msg = err?.response?.data?.message || "Failed to upload & apply.";
      setToast({ open: true, severity: "error", message: msg });
    }
  }

  if (!job && loading) {
    return <Box sx={{ p: 4 }}><Typography>Loading job...</Typography></Box>;
  }

  if (!job) {
    return <Box sx={{ p: 4 }}><Typography>Job not found.</Typography></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 6 } }}>
      <Stack spacing={3} direction={{ xs: "column", md: "row" }}>
        {/* Left: Job details */}
        <Box flex={1}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={800}>{job.title}</Typography>
            <Stack direction="row" spacing={2} mt={1} alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>{job.company}</Typography>
              <Chip label={job.location} size="small" />
              {job.role && <Chip label={job.role} size="small" />}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" mt={2}>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(job.salaryMin)}{job.salaryMax ? ` - ${formatCurrency(job.salaryMax)}` : ""}
              </Typography>
              {job.workMode && <Chip label={job.workMode} size="small" sx={{ ml: 1 }} />}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{job.description}</Typography>

            <Box mt={3}>
              <Typography variant="caption" color="text.secondary">
                Posted by: {job.postedBy?.name ?? "Unknown"} ({job.postedBy?.email ?? "—"})
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Right: Apply card */}
        <Box sx={{ width: { xs: "100%", md: 360 } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={800}>Apply for this job</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can either provide a resume URL or upload a PDF resume.
              </Typography>

              {/* If not logged in or not USER */}
              {!user ? (
                <Box>
                  <Typography color="text.secondary">Please <Link to="/login">login</Link> to apply.</Typography>
                </Box>
              ) : user.role !== "USER" ? (
                <Box>
                  <Typography color="error">Only applicants (USER role) can apply. You are logged in as {user.role}.</Typography>
                </Box>
              ) : userAlreadyApplied ? (
                <Box>
                  <Typography color="success.main">You have already applied to this job.</Typography>
                </Box>
              ) : (
                <>
                  {/* Apply by URL */}
                  <Stack component="form" onSubmit={handleApplyByUrl} spacing={1} mt={1}>
                    <TextField
                      fullWidth
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://your-resume-hosting.com/resume.pdf"
                      label="Resume URL"
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><LinkIcon /></InputAdornment>
                      }}
                      size="small"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<LinkIcon />}
                    >
                      Apply with URL
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  {/* Apply by file upload */}
                  <Stack spacing={1}>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf"
                      style={{ display: "none" }}
                      id="resume-file-input"
                      onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <label htmlFor="resume-file-input">
                      <Button variant="outlined" component="span" startIcon={<UploadFileIcon />}>
                        {file ? file.name : "Choose PDF resume"}
                      </Button>
                    </label>
                    <Button
                      variant="contained"
                      disabled={!file}
                      onClick={handleFileUploadApply}
                    >
                      Upload & Apply
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Max file size: 5MB. Only PDF accepted.
                    </Typography>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>

          {/* Applications list (simple) */}
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="subtitle2">Applications</Typography>
            {job.applications?.length ? (
              job.applications.map((a) => (
                <Box key={a.id} sx={{ mt: 1 }}>
                  <Typography variant="body2">{a.user?.name ?? `User ${a.userId}`}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(a.createdAt).toLocaleString()} — {a.status}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">No applications yet.</Typography>
            )}
          </Paper>
        </Box>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(s => ({ ...s, open: false }))}>
        <Alert severity={toast.severity || "info"} onClose={() => setToast(s => ({ ...s, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}