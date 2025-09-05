// frontend/src/pages/RecruiterDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { Link as RouterLink } from 'react-router-dom';
import CountUp from 'react-countup';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import {
  Box, Paper, Typography, Avatar, Button, Grid, CircularProgress,
  Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, LinearProgress, Container, Stack, Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkIcon from '@mui/icons-material/Work';
import LoginIcon from '@mui/icons-material/Login';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Styled components with compact styling
const DashboardContainer = styled(Container)(({ theme }) => ({
  background: theme.palette.grey[50],
  minHeight: '100vh',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

const CompactCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease',
  height: '100%',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }
}));

const StatCard = styled(CompactCard)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
  borderLeft: `4px solid ${theme.palette.primary.main}`,
}));

const ProfileCard = styled(CompactCard)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
}));

const ActionCard = styled(CompactCard)(({ theme }) => ({
  padding: theme.spacing(1.5),
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'block',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  }
}));

const ChartCard = styled(CompactCard)(({ theme }) => ({
  padding: theme.spacing(1.5),
}));

const TableCard = styled(CompactCard)(({ theme }) => ({
  '& .MuiTableHead-root': {
    '& .MuiTableCell-root': {
      fontWeight: 600,
      backgroundColor: theme.palette.grey[100],
      padding: theme.spacing(1),
      fontSize: '0.875rem',
    }
  },
  '& .MuiTableBody-root': {
    '& .MuiTableCell-root': {
      padding: theme.spacing(1),
      fontSize: '0.875rem',
    }
  },
}));

const SmallAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  fontSize: '1rem',
  background: theme.palette.primary.light,
}));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: 'background.paper',
        p: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        boxShadow: 2,
        fontSize: '0.875rem'
      }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" color="primary">
          Views: {payload[0].value}
        </Typography>
        <Typography variant="body2" color="secondary">
          Applications: {payload[1].value}
        </Typography>
      </Box>
    );
  }
  return null;
};

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

  // Memoize computed values
  const { profile, stats, jobs, viewsByMonth, appsByMonth } = useMemo(() => {
    if (!data) return { profile: null, stats: null, jobs: [], viewsByMonth: [], appsByMonth: [] };
    
    return {
      profile: data.profile,
      stats: data.stats,
      jobs: data.jobs || [],
      viewsByMonth: data.analytics?.viewsByMonth || [],
      appsByMonth: data.analytics?.appsByMonth || []
    };
  }, [data]);

  const combinedData = useMemo(() => 
    viewsByMonth.map((item: any, index: number) => ({
      ...item,
      applications: appsByMonth[index]?.count || 0
    })),
    [viewsByMonth, appsByMonth]
  );

  const pieData = useMemo(() => [
    { name: 'Active Jobs', value: stats?.jobCount || 0, color: '#1976d2' },
    { name: 'Applications', value: stats?.totalApplications || 0, color: '#ff6f00' },
    { name: 'Profile Views', value: stats?.totalViews || 0, color: '#4caf50' }
  ], [stats]);

  const topPerformingJobs = useMemo(() => 
    jobs.sort((a: JobRow, b: JobRow) => b.applicationsCount - a.applicationsCount).slice(0, 3),
    [jobs]
  );

  if (loading) {
    return (
      <DashboardContainer maxWidth="xl">
        <CompactCard sx={{ p: 3, textAlign: 'center' }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={40} />
            <Typography variant="body1">
              Loading your dashboard...
            </Typography>
          </Stack>
        </CompactCard>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer maxWidth="xl">
        <CompactCard sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()} size="small">
            Retry
          </Button>
        </CompactCard>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Recruiter Dashboard
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Left Column - Main Content */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {/* Profile Card */}
            <ProfileCard>
              <Box display="flex" alignItems="center" gap={2}>
                <SmallAvatar>
                  {(profile?.name || 'R').charAt(0).toUpperCase()}
                </SmallAvatar>
                <Box flex={1}>
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    Hello, {profile?.name || 'Recruiter'}
                  </Typography>
                  <Chip 
                    label="RECRUITER"
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.3)', 
                      color: 'white',
                      fontWeight: 600,
                      height: 20
                    }}
                  />
                </Box>
              </Box>
            </ProfileCard>

            {/* Stats Grid */}
            <Grid container spacing={1}>
              {[
                { title: 'Jobs Posted', value: stats?.jobCount ?? 0, icon: WorkIcon },
                { title: 'Total Views', value: stats?.totalViews ?? 0, icon: VisibilityIcon },
                { title: 'Applications', value: stats?.totalApplications ?? 0, icon: PeopleOutlineIcon },
                { title: 'Login Sessions', value: stats?.loginCount ?? 0, icon: LoginIcon }
              ].map((stat, index) => (
                <Grid item xs={6} sm={3} key={stat.title}>
                  <StatCard>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '8px', 
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mx: 'auto',
                      mb: 1
                    }}>
                      <stat.icon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      <CountUp end={stat.value} duration={2} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </StatCard>
                </Grid>
              ))}
            </Grid>

            {/* Charts */}
            <Grid container spacing={1}>
              <Grid item xs={12} md={7}>
                <ChartCard>
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    Views & Applications Trend
                  </Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stackId="1"
                          stroke="#1976d2" 
                          fill="#1976d2"
                          fillOpacity={0.2}
                          name="Views"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="applications" 
                          stackId="2"
                          stroke="#ff6f00" 
                          fill="#ff6f00"
                          fillOpacity={0.2}
                          name="Applications"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={5}>
                <ChartCard>
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    Performance Overview
                  </Typography>
                  <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </ChartCard>
              </Grid>
            </Grid>

            {/* Jobs Table */}
            <TableCard>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Active Jobs
                </Typography>
                {jobs.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No jobs posted yet.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Job Title</TableCell>
                          <TableCell align="center">Applications</TableCell>
                          <TableCell align="center">Views</TableCell>
                          <TableCell align="center">Performance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {jobs.map((job: JobRow, index: number) => {
                          const conversionRate = job.views > 0 ? ((job.applicationsCount / job.views) * 100).toFixed(1) : '0';
                          return (
                            <TableRow key={job.id}>
                              <TableCell>
                                <Typography fontWeight={600} fontSize="0.875rem">
                                  {job.title}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={job.applicationsCount} 
                                  color="primary"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center">
                                  <VisibilityIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography fontSize="0.875rem">
                                    {job.views}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center">
                                  <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                                    {conversionRate}%
                                  </Typography>
                                  {parseFloat(conversionRate) > 5 ? 
                                    <ArrowUpwardIcon sx={{ fontSize: 14, color: 'success.main', ml: 0.5 }} /> :
                                    <ArrowDownwardIcon sx={{ fontSize: 14, color: 'warning.main', ml: 0.5 }} />
                                  }
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </TableCard>
          </Stack>
        </Grid>

        {/* Right Column - Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Quick Actions */}
            <Box>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <ActionCard component={RouterLink} to="/jobs/new">
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <AddCircleOutlineIcon color="primary" sx={{ fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Create Job
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </ActionCard>

                <ActionCard component={RouterLink} to="/recruiter/applicants">
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <PeopleOutlineIcon color="primary" sx={{ fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          View Applications
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Review job applications
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </ActionCard>
              </Stack>
            </Box>

            {/* Top Performing Jobs */}
            <CompactCard>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Top Performing Jobs
                </Typography>
                {topPerformingJobs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    No job performance data yet
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {topPerformingJobs.map((job: JobRow, index: number) => (
                      <Box key={job.id} sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          {job.title}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center">
                            <PeopleOutlineIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">
                              {job.applicationsCount} applications
                            </Typography>
                          </Box>
                          <Chip 
                            label={`#${index + 1}`} 
                            size="small" 
                            color="primary"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </CompactCard>

            {/* Analytics Insights */}
            <CompactCard>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <AnalyticsIcon color="primary" sx={{ fontSize: 20 }} />
                  <Typography variant="body1" fontWeight={600}>
                    Quick Insights
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average applications per job
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {jobs.length > 0 ? Math.round((stats?.totalApplications || 0) / jobs.length) : 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average views per job
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {jobs.length > 0 ? Math.round((stats?.totalViews || 0) / jobs.length) : 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Overall conversion rate
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {stats?.totalViews > 0 ? ((stats?.totalApplications || 0) / stats.totalViews * 100).toFixed(1) : 0}%
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CompactCard>
          </Stack>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
}