import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  Box, Paper, Typography, TextField, Button, Stack, MenuItem, Snackbar, Alert,
  InputAdornment, Fade, Zoom, Slide, Card, CardContent, LinearProgress
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import PublishIcon from '@mui/icons-material/Publish';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion, AnimatePresence } from 'framer-motion';

// Styled Components
const GradientContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: 24,
  overflow: 'hidden',
  position: 'relative',
  boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.1)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 16,
    transition: 'all 0.3s ease-in-out',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.25)}`,
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  borderRadius: 16,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '1.1rem',
  padding: '16px 32px',
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`,
  },
  '&:active': {
    transform: 'translateY(-1px)',
  },
  '&:disabled': {
    background: alpha(theme.palette.grey[400], 0.6),
    transform: 'none',
    boxShadow: 'none',
  }
}));

const FloatingCard = styled(motion.div)(({ theme }) => ({
  width: '100%',
  maxWidth: 700,
}));

const workModes = [
  { value: 'OFFICE', label: 'Work from Office', icon: '🏢' },
  { value: 'HOME', label: 'Work from Home', icon: '🏠' },
  { value: 'REMOTE', label: 'Remote', icon: '🌍' },
  { value: 'HYBRID', label: 'Hybrid', icon: '🔄' },
];

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      staggerChildren: 0.1,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const formSectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 }
  }
};

export default function JobCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    salaryMin: '',
    salaryMax: '',
    workMode: '',
    role: '',
     incentive: '',   // ✅ new
  workTime: '',    // ✅ new
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setForm({ ...form, [e.target.name as string]: e.target.value as string });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
          incentive: form.incentive || undefined,
  workTime: form.workTime || undefined,
      };
      const res = await api.post('/jobs', payload);
      setSnackbar({ open: true, message: 'Job posted successfully!', severity: 'success' });
      setTimeout(() => {
        navigate(`/jobs/${res.data.job.id}_${res.data.job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
      }, 1200);
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to post job', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientContainer>
      <FloatingCard
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StyledPaper elevation={0}>
          {loading && (
            <LinearProgress 
              sx={{ 
                position: 'absolute', 
                top: 6, 
                left: 0, 
                right: 0,
                height: 4,
                borderRadius: 2,
                background: 'transparent'
              }} 
            />
          )}
          
          <Box sx={{ p: { xs: 3, md: 5 } }}>
            <motion.div variants={itemVariants}>
              <Box textAlign="center" mb={4}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <PublishIcon 
                    sx={{ 
                      fontSize: 64, 
                      color: 'primary.main',
                      mb: 2,
                      filter: 'drop-shadow(0 4px 8px rgba(25,118,210,0.3))'
                    }} 
                  />
                </motion.div>
                <Typography 
                  variant="h3" 
                  fontWeight={800}
                  sx={{ 
                    background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  Post a New Job
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={400}>
                  Find the perfect candidate for your team
                </Typography>
              </Box>
            </motion.div>

            <motion.form onSubmit={handleSubmit} variants={itemVariants}>
              <Stack spacing={4}>
                {/* Job Title & Company Row */}
                <motion.div variants={formSectionVariants}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <StyledTextField
                      label="Job Title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <StyledTextField
                      label="Company"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                </motion.div>

                {/* Location & Role Row */}
                <motion.div variants={formSectionVariants}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <StyledTextField
                      label="Location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOnIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <StyledTextField
                      label="Role (e.g. Frontend, Backend)"
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon color="secondary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                </motion.div>

                {/* Description */}
                <motion.div variants={formSectionVariants}>
                  <StyledTextField
                    label="Job Description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    multiline
                    minRows={6}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                          <DescriptionIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start',
                      }
                    }}
                  />
                </motion.div>

                {/* Salary Range */}
                <motion.div variants={formSectionVariants}>
                  <Typography variant="h6" fontWeight={600} mb={2} color="primary">
                    💰 Salary Range (Optional)
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <StyledTextField
                      label="Minimum Salary"
                      name="salaryMin"
                      value={form.salaryMin}
                      onChange={handleChange}
                      type="number"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CurrencyRupeeIcon color="success" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <StyledTextField
                      label="Maximum Salary"
                      name="salaryMax"
                      value={form.salaryMax}
                      onChange={handleChange}
                      type="number"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CurrencyRupeeIcon color="success" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                </motion.div>

                {/* Incentive & Work Time Row */}
<motion.div variants={formSectionVariants}>
  <Typography variant="h6" fontWeight={600} mb={2} color="primary">
    🎁 Incentive & ⏰ Working Time
  </Typography>
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
    <StyledTextField
      label="Incentive (e.g. Performance Bonus, Allowances)"
      name="incentive"
      value={form.incentive}
      onChange={handleChange}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <CurrencyRupeeIcon color="secondary" />
          </InputAdornment>
        ),
      }}
    />
    <StyledTextField
      label="Working Time (e.g. 9 AM – 6 PM)"
      name="workTime"
      value={form.workTime}
      onChange={handleChange}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <WorkIcon color="primary" />
          </InputAdornment>
        ),
      }}
    />
  </Stack>
</motion.div>


                {/* Work Mode */}
                <motion.div variants={formSectionVariants}>
                  <Typography variant="h6" fontWeight={600} mb={2} color="primary">
                    🏢 Work Mode
                  </Typography>
                  <StyledTextField
                    select
                    label="Select Work Mode"
                    name="workMode"
                    value={form.workMode}
                    onChange={handleSelectChange}
                    fullWidth
                    required
                  >
                    <MenuItem value="" disabled>
                      <em>Choose work arrangement</em>
                    </MenuItem>
                    {workModes.map((wm) => (
                      <MenuItem key={wm.value} value={wm.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{wm.icon}</span>
                          <span>{wm.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </StyledTextField>
                </motion.div>

                {/* Submit Button */}
                <motion.div 
                  variants={formSectionVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box pt={2}>
                    <GradientButton
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      fullWidth
                      startIcon={
                        loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <PublishIcon />
                          </motion.div>
                        ) : (
                          <PublishIcon />
                        )
                      }
                    >
                      {loading ? 'Publishing Job...' : 'Publish Job Posting'}
                    </GradientButton>
                  </Box>
                </motion.div>
              </Stack>
            </motion.form>
          </Box>
        </StyledPaper>
      </FloatingCard>

      <AnimatePresence>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          TransitionComponent={Slide}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : undefined}
            sx={{ 
              borderRadius: 3,
              fontWeight: 600,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </AnimatePresence>
    </GradientContainer>
  );
}