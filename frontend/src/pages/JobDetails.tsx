// frontend/src/pages/JobDetail.tsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Box, Paper, Stack, Typography, Chip, Button, Card, CardContent,
  TextField, Snackbar, Alert, InputAdornment, IconButton, Divider,
  Avatar, Skeleton, Fade, Zoom, Slide
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LinkIcon from "@mui/icons-material/Link";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BusinessIcon from "@mui/icons-material/Business";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LoginIcon from "@mui/icons-material/Login";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import { useAuth } from "../auth/AuthProvider";

// Styled components
const GradientPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: 16,
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
  }
}));

const AnimatedChip = styled(Chip)(({ theme }) => ({
  borderRadius: 12,
  fontWeight: 600,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 24px',
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
  },
  '&:active': {
    transform: 'translateY(0px)',
  }
}));

const FloatingActionCard = styled(motion.div)(({ theme }) => ({
  position: 'sticky',
  top: 24,
  zIndex: 10,
}));

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

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function JobDetail() {
  const { idSlug } = useParams<{ idSlug: string }>();
  const jobId = parseIdFromSlug(idSlug);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    setIsSubmitting(true);
    try {
      await api.post(`/applications/jobs/${jobId}/apply`, { resumeUrl });
      setToast({ open: true, severity: "success", message: "Application submitted — recruiter will be notified." });
      setResumeUrl("");
      loadJob();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to apply.";
      setToast({ open: true, severity: "error", message: msg });
    } finally {
      setIsSubmitting(false);
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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 6 } }}>
        <Stack spacing={3} direction={{ xs: "column", md: "row" }}>
          <Box flex={1}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Box>
          <Box sx={{ width: { xs: "100%", md: 360 } }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Box>
        </Stack>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" color="text.secondary">Job not found</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            The job you're looking for doesn't exist or has been removed.
          </Typography>
        </motion.div>
      </Box>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ p: { xs: 2, md: 6 }, minHeight: '100vh' }}>
        <Stack spacing={4} direction={{ xs: "column", md: "row" }}>
          {/* Left: Job details */}
          <motion.div variants={itemVariants} style={{ flex: 1 }}>
            <GradientPaper sx={{ p: 4 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Typography 
                  variant="h3" 
                  fontWeight={800} 
                  sx={{ 
                    background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                  }}
                >
                  {job.title}
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Stack direction="row" spacing={2} mt={2} alignItems="center" flexWrap="wrap" gap={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {job.company}
                    </Typography>
                  </Stack>
                  <AnimatedChip 
                    icon={<LocationOnIcon />} 
                    label={job.location} 
                    color="primary" 
                    variant="outlined" 
                  />
                  {job.role && (
                    <AnimatedChip 
                      icon={<WorkIcon />} 
                      label={job.role} 
                      color="secondary" 
                      variant="outlined" 
                    />
                  )}
                </Stack>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Stack direction="row" spacing={2} alignItems="center" mt={3} flexWrap="wrap" gap={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AttachMoneyIcon color="success" />
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {formatCurrency(job.salaryMin)}{job.salaryMax ? ` - ${formatCurrency(job.salaryMax)}` : ""}
                    </Typography>
                  </Stack>
                  {job.workMode && (
                    <AnimatedChip 
                      label={job.workMode} 
                      color="success" 
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Divider sx={{ my: 3, background: 'linear-gradient(90deg, transparent 0%, rgba(25,118,210,0.5) 50%, transparent 100%)' }} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: "pre-wrap", 
                    lineHeight: 1.8,
                    fontSize: '1.1rem'
                  }}
                >
                  {job.description}
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Box 
                  mt={4} 
                  p={3} 
                  sx={{ 
                    background: alpha('#1976d2', 0.05),
                    borderRadius: 2,
                    border: `1px solid ${alpha('#1976d2', 0.1)}`
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {job.postedBy?.name?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Posted by: {job.postedBy?.name ?? "Unknown"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </motion.div>
            </GradientPaper>
          </motion.div>

          {/* Right: Apply card */}
          <motion.div variants={itemVariants}>
            <FloatingActionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ width: '100%', maxWidth: { xs: '100%', md: 380 } }}
            >
              <StyledCard>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
                    Apply for this job
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    You can either provide a resume URL or upload a PDF resume.
                  </Typography>

                  <AnimatePresence mode="wait">
                    {!user ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box 
                          sx={{ 
                            textAlign: 'center', 
                            p: 3,
                            background: alpha('#2196f3', 0.05),
                            borderRadius: 2,
                            border: `1px solid ${alpha('#2196f3', 0.2)}`
                          }}
                        >
                          <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            Please login to apply for this position
                          </Typography>
                          <Button
                            component={Link}
                            to="/login"
                            variant="contained"
                            startIcon={<LoginIcon />}
                            sx={{ borderRadius: 3 }}
                          >
                            Login to Apply
                          </Button>
                        </Box>
                      </motion.div>
                    ) : user.role !== "USER" ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box 
                          sx={{ 
                            textAlign: 'center', 
                            p: 3,
                            background: alpha('#f44336', 0.05),
                            borderRadius: 2,
                            border: `1px solid ${alpha('#f44336', 0.2)}`
                          }}
                        >
                          <Typography color="error" variant="body1">
                            Only applicants (USER role) can apply. You are logged in as {user.role}.
                          </Typography>
                        </Box>
                      </motion.div>
                    ) : userAlreadyApplied ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box 
                          sx={{ 
                            textAlign: 'center', 
                            p: 3,
                            background: alpha('#4caf50', 0.05),
                            borderRadius: 2,
                            border: `1px solid ${alpha('#4caf50', 0.2)}`
                          }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                          <Typography color="success.main" variant="h6" fontWeight={600}>
                            Application Submitted!
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            You have already applied to this job.
                          </Typography>
                        </Box>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Apply by URL */}
                        <Box component="form" onSubmit={handleApplyByUrl} sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                            Option 1: Resume URL
                          </Typography>
                          <Stack spacing={2}>
                            <TextField
                              fullWidth
                              value={resumeUrl}
                              onChange={(e) => setResumeUrl(e.target.value)}
                              placeholder="https://your-resume-hosting.com/resume.pdf"
                              label="Resume URL"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LinkIcon color="primary" />
                                  </InputAdornment>
                                )
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  '&:hover fieldset': {
                                    borderColor: 'primary.main',
                                  }
                                }
                              }}
                            />
                            <GradientButton
                              type="submit"
                              variant="contained"
                              startIcon={<LinkIcon />}
                              disabled={isSubmitting}
                              fullWidth
                            >
                              {isSubmitting ? 'Submitting...' : 'Apply with URL'}
                            </GradientButton>
                          </Stack>
                        </Box>

                        <Divider sx={{ my: 3 }}>
                          <Typography variant="body2" color="text.secondary">OR</Typography>
                        </Divider>

                        {/* Apply by file upload */}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                            Option 2: Upload Resume
                          </Typography>
                          <Stack spacing={2}>
                            <input
                              ref={fileRef}
                              type="file"
                              accept="application/pdf"
                              style={{ display: "none" }}
                              id="resume-file-input"
                              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            />
                            <label htmlFor="resume-file-input">
                              <Button 
                                variant="outlined" 
                                component="span" 
                                startIcon={<UploadFileIcon />}
                                fullWidth
                                sx={{ 
                                  borderRadius: 2,
                                  borderStyle: 'dashed',
                                  borderWidth: 2,
                                  padding: 2,
                                  '&:hover': {
                                    borderStyle: 'dashed',
                                    borderWidth: 2,
                                  }
                                }}
                              >
                                {file ? file.name : "Choose PDF resume"}
                              </Button>
                            </label>
                            <GradientButton
                              variant="contained"
                              disabled={!file || isSubmitting}
                              onClick={handleFileUploadApply}
                              fullWidth
                            >
                              {isSubmitting ? 'Uploading...' : 'Upload & Apply'}
                            </GradientButton>
                            <Typography variant="caption" color="text.secondary" textAlign="center">
                              Max file size: 5MB. Only PDF accepted.
                            </Typography>
                          </Stack>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </StyledCard>
            </FloatingActionCard>
          </motion.div>
        </Stack>

        <Snackbar 
          open={toast.open} 
          autoHideDuration={4000} 
          onClose={() => setToast(s => ({ ...s, open: false }))}
          TransitionComponent={Slide}
        >
          <Alert 
            severity={toast.severity || "info"} 
            onClose={() => setToast(s => ({ ...s, open: false }))}
            sx={{ borderRadius: 2 }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}