// frontend/src/pages/RecruiterDashboard.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { Link as RouterLink } from 'react-router-dom';
import CountUp from 'react-countup';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import {
  Box, Paper, Typography, Avatar, Button, Grid, CircularProgress, Divider,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';

type JobRow = {
  id: number;
  title: string;
  company?: string;
  location?: string;
  createdAt: string;
  applicationsCount: number;
  views: number;
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.get('/recruiter/me');
        if (cancelled) return;
        setData(res.data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Box className="max-w-6xl mx-auto p-6">
        <Paper className="p-6 flex items-center justify-center">
          <CircularProgress />
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="max-w-6xl mx-auto p-6">
        <Paper className="p-6">
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  const profile = data.profile;
  const stats = data.stats;
  const jobs: JobRow[] = data.jobs || [];
  const viewsByMonth = data.analytics?.viewsByMonth || [];
  const appsByMonth = data.analytics?.appsByMonth || [];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto p-6">
      <Typography variant="h5" className="mb-2">Recruiter Dashboard</Typography>
      <Typography variant="body2" className="mb-4">{profile?.name ? `Welcome, ${profile.name}` : 'Welcome.'}</Typography>
      <Box sx={{ height: 16 }} /> {/* Add vertical space */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* left / middle */}
        <div className="flex-1 space-y-6">
          {/* Profile card */}
          <Paper className="p-4 flex items-center gap-4">
            <Avatar sx={{ width: 64, height: 64 }}>{(profile?.name || '').slice(0,1)}</Avatar>
            <div>
              <Typography variant="h6">{profile?.name || '—'}</Typography>
              <Typography variant="body2">{profile?.email}</Typography>
              <Typography variant="caption">Jobs posted: {stats?.jobCount ?? 0}</Typography>
            </div>
          </Paper>

          {/* Stats row */}
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Paper className="p-4 text-center">
                <Typography variant="subtitle2">Jobs Posted</Typography>
                <Typography variant="h5"><CountUp end={stats?.jobCount ?? 0} duration={1.4} /></Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper className="p-4 text-center">
                <Typography variant="subtitle2">Total Views</Typography>
                <Typography variant="h5"><CountUp end={stats?.totalViews ?? 0} duration={1.6} /></Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper className="p-4 text-center">
                <Typography variant="subtitle2">Applications</Typography>
                <Typography variant="h5"><CountUp end={stats?.totalApplications ?? 0} duration={1.6} /></Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper className="p-4 text-center">
                <Typography variant="subtitle2">Logins</Typography>
                <Typography variant="h5"><CountUp end={stats?.loginCount ?? 0} duration={1.2} /></Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Paper className="p-4">
              <Typography variant="subtitle1">Views (last 6 months)</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={viewsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3f51b5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>

            <Paper className="p-4">
              <Typography variant="subtitle1">Applications (last 6 months)</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={appsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#ff6f00" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </div>

          {/* Jobs table (compact) */}
          <Paper className="p-4">
            <Typography variant="subtitle1" className="mb-2">Your Jobs</Typography>
            {jobs.length === 0 ? (
              <Typography>No jobs posted yet.</Typography>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Applicants</th>
                      <th className="text-left p-2">Views</th>
                      <th className="text-left p-2">Posted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id} className="border-t">
                        <td className="p-2">{j.title}</td>
                        <td className="p-2">{j.company}</td>
                        <td className="p-2">{j.applicationsCount}</td>
                        <td className="p-2">{j.views}</td>
                        <td className="p-2">{new Date(j.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Paper>
        </div>

        {/* right sidebar */}
        <aside className="w-full md:w-80 flex flex-col gap-4">
          <motion.div whileHover={{ scale: 1.02 }} className="shadow-sm">
            <Paper component={RouterLink} to="/jobs/new" className="p-4 flex items-center gap-3 no-underline hover:shadow-md" elevation={2}>
              <AddCircleOutlineIcon fontSize="large" />
              <div>
                <Typography variant="subtitle1">Create & Post Job</Typography>
                <Typography variant="body2">Open your job creation form</Typography>
              </div>
            </Paper>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Paper component={RouterLink} to="/recruiter/applicants" className="p-4 flex items-center gap-3 no-underline hover:shadow-md" elevation={2}>
              <PeopleOutlineIcon fontSize="large" />
              <div>
                <Typography variant="subtitle1">Applicants</Typography>
                <Typography variant="body2">View applicants to your jobs</Typography>
              </div>
            </Paper>
          </motion.div>
        </aside>
      </div>
    </motion.div>
  );
}
