import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  Box, Paper, Typography, TextField, Button, Stack, MenuItem, Snackbar, Alert
} from '@mui/material';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

const workModes = [
  { value: 'OFFICE', label: 'Work from Office' },
  { value: 'HOME', label: 'Work from Home' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
];

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
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

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
    <Box className="max-w-2xl mx-auto p-6">
      <Paper className="p-6" elevation={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Post a New Job
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Job Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Company"
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Location"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Role (e.g. Frontend, Backend)"
              name="role"
              value={form.role}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              multiline
              minRows={4}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Min Salary"
                name="salaryMin"
                value={form.salaryMin}
                onChange={handleChange}
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <CurrencyRupeeIcon sx={{ mr: 1, opacity: 0.6 }} />,
                }}
              />
              <TextField
                label="Max Salary"
                name="salaryMax"
                value={form.salaryMax}
                onChange={handleChange}
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <CurrencyRupeeIcon sx={{ mr: 1, opacity: 0.6 }} />,
                }}
              />
            </Stack>
            <TextField
              select
              label="Work Mode"
              name="workMode"
              value={form.workMode}
              onChange={handleSelectChange}
              fullWidth
              required
            >
              <MenuItem value="">Select work mode</MenuItem>
              {workModes.map((wm) => (
                <MenuItem key={wm.value} value={wm.value}>{wm.label}</MenuItem>
              ))}
            </TextField>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                borderRadius: 3,
                py: 1.2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(102,126,234,0.6)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          </Stack>
        </form>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}