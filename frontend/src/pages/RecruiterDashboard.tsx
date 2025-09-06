// frontend/src/pages/RecruiterDashboard.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { Link as RouterLink } from 'react-router-dom';
import CountUp from 'react-countup';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import {
  Box, Paper, Typography, Avatar, Button, Grid, CircularProgress, Divider,
  Card, CardContent, IconButton, Chip, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, LinearProgress, Container, Stack, Fade, Grow, Slide,
  useMediaQuery, Theme
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkIcon from '@mui/icons-material/Work';
import LoginIcon from '@mui/icons-material/Login';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Styled components with animations
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
  }
  70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const DashboardContainer = styled(Container)(({ theme }) => ({
  background: `linear-gradient(-45deg, ${theme.palette.background.default}, ${theme.palette.action.hover}, ${theme.palette.background.paper})`,
  backgroundSize: '400% 400%',
  animation: `${gradientShift} 15s ease infinite`,
  minHeight: '100vh',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.9) 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
  }
}));

const StatCard = styled(StyledCard)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}20, transparent)`,
    transition: 'left 0.5s',
  },
  '&:hover::before': {
    left: '100%',
  }
}));

const ProfileCard = styled(StyledCard)(({ theme }) => ({
  background: `linear-gradient(135deg, #0a1929 0%, #1e3a5f 100%)`,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    transform: 'translateY(-5px) scale(1.02)',
  }
}));

const ActionCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  textDecoration: 'none',
  '&:hover': {
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    textDecoration: 'none',
  }
}));

const ChartCard = styled(StyledCard)(({ theme }) => ({
  height: 340,
  '& .recharts-cartesian-grid-horizontal line': {
    stroke: theme.palette.divider,
  },
  '& .recharts-cartesian-grid-vertical line': {
    stroke: theme.palette.divider,
  }
}));

const TableCard = styled(StyledCard)(({ theme }) => ({
  '& .MuiTableHead-root': {
    '& .MuiTableCell-root': {
      fontWeight: 600,
      backgroundColor: theme.palette.action.hover,
      borderBottom: `2px solid ${theme.palette.primary.main}`,
    }
  },
  '& .MuiTableRow-root': {
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'scale(1.01)',
    }
  }
}));

const GlowingAvatar = styled(Avatar)(({ theme }) => ({
  width: 70,
  height: 70,
  fontSize: '1.8rem',
  fontWeight: 'bold',
  background: `linear-gradient(45deg, ${theme.palette.background.paper}, ${theme.palette.primary.light})`,
  color: theme.palette.primary.main,
  border: `2px solid ${theme.palette.primary.main}`,
  boxShadow: `0 0 15px ${theme.palette.primary.main}40`,
  animation: `${pulse} 3s infinite`,
}));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 2
      }}>
        <Typography variant="body2">{`${label}: ${payload[0].value}`}</Typography>
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
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

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
      <DashboardContainer maxWidth="xl">
        <StyledCard sx={{ p: 4, textAlign: 'center' }}>
          <Stack alignItems="center" spacing={3}>
            <CircularProgress size={50} thickness={4} />
            <Typography variant="h6" color="text.secondary">
              Loading your dashboard...
            </Typography>
            <LinearProgress sx={{ width: 250, borderRadius: 2, height: 6 }} />
          </Stack>
        </StyledCard>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer maxWidth="xl">
        <StyledCard sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </StyledCard>
      </DashboardContainer>
    );
  }

  const profile = data.profile || { name: 'Arnab', email: 'b120053@lib.bh.ac.in' };
  const stats = data.stats || { jobCount: 1, totalViews: 3, totalApplications: 1, loginCount: 5 };
  const jobs: JobRow[] = data.jobs || [{ 
    id: 1, 
    title: 'AIML', 
    company: 'EY', 
    createdAt: '2025-08-28', 
    applicationsCount: 1, 
    views: 3 
  }];
  
  const viewsByMonth = data.analytics?.viewsByMonth || [
    { month: '2025-04', count: 2 },
    { month: '2025-06', count: 1 },
    { month: '2025-09', count: 3 }
  ];
  
  const appsByMonth = data.analytics?.appsByMonth || [
    { month: '2025-04', count: 1 },
    { month: '2025-06', count: 0 },
    { month: '2025-09', count: 1 }
  ];

  // Enhanced analytics data
  const combinedData = viewsByMonth.map((item: any, index: number) => ({
    ...item,
    applications: appsByMonth[index]?.count || 0
  }));

  const pieData = [
    { name: 'Active Jobs', value: stats?.jobCount || 0, color: '#1976d2' },
    { name: 'Total Applications', value: stats?.totalApplications || 0, color: '#ff6f00' },
    { name: 'Profile Views', value: stats?.totalViews || 0, color: '#4caf50' }
  ];

  const topPerformingJobs = jobs
    .sort((a, b) => b.applicationsCount - a.applicationsCount)
    .slice(0, 3);

  // Right sidebar content
  const quickActions = (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Quick Actions
      </Typography>
      <Stack spacing={2}>
        <ActionCard
  component={RouterLink}
  to="/jobs/new"
  sx={{
    background: 'linear-gradient(135deg, #0e2aaa9e 0%, #211e5bb6 100%)',
    color: '#fff',
  }}
>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <AddCircleOutlineIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Create Job
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Post a new job opening
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </ActionCard>

        <ActionCard
  component={RouterLink}
  to="/recruiter/applicants"
  sx={{
    background: 'linear-gradient(135deg, #07500bbc 0%, #04410fff 100%)',
    color: '#fff',
  }}
>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <PeopleOutlineIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  View Applicants
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Review job applications
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </ActionCard>
      </Stack>
    </motion.div>
  );

  const topPerformingJobsSection = (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <StyledCard>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Top Performing Jobs
          </Typography>
          {topPerformingJobs.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No job performance data yet
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {topPerformingJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      {job.title}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PeopleOutlineIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {job.applicationsCount} applications
                        </Typography>
                      </Stack>
                      <Chip 
                        label={`#${index + 1}`} 
                        size="small" 
                        color="primary"
                      />
                    </Stack>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          )}
        </CardContent>
      </StyledCard>
    </motion.div>
  );

  const quickInsights = (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <StyledCard>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <AnalyticsIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Quick Insights
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'success.light',
              color: 'success.contrastText'
            }}>
              <Typography variant="body2" fontWeight={600}>
                Average applications per job: {jobs.length > 0 ? Math.round((stats?.totalApplications || 0) / jobs.length) : 0}
              </Typography>
            </Box>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'info.light',
              color: 'info.contrastText'
            }}>
              <Typography variant="body2" fontWeight={600}>
                Average views per job: {jobs.length > 0 ? Math.round((stats?.totalViews || 0) / jobs.length) : 0}
              </Typography>
            </Box>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'warning.light',
              color: 'warning.contrastText'
            }}>
              <Typography variant="body2" fontWeight={600}>
                Overall conversion rate: {stats?.totalViews > 0 ? ((stats?.totalApplications || 0) / stats.totalViews * 100).toFixed(1) : 0}%
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </StyledCard>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <DashboardContainer maxWidth="xl">
        {/* Header */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" fontWeight={800} color="primary.main" gutterBottom>
              Recruiter Dashboard
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {profile?.name ? `Welcome back, ${profile.name}` : 'Welcome to your recruitment hub'}
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Profile Card */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <ProfileCard>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <GlowingAvatar>
                        {(profile?.name || 'R').charAt(0).toUpperCase()}
                      </GlowingAvatar>
                      <Box flex={1}>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                          {profile?.name || 'Recruiter'}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                          {profile?.email}
                        </Typography>
                        <Chip 
                          label={`${stats?.jobCount ?? 0} Active Jobs`}
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.2)', 
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </ProfileCard>
              </motion.div>

              {/* Quick Actions for Mobile */}
              {isMobile && quickActions}

              {/* Stats Grid */}
              <Grid container spacing={3}>
                {[
                  { title: 'Jobs Posted', value: stats?.jobCount ?? 0, icon: WorkIcon, color: '#1976d2' },
                  { title: 'Total Views', value: stats?.totalViews ?? 0, icon: VisibilityIcon, color: '#4caf50' },
                  { title: 'Applications', value: stats?.totalApplications ?? 0, icon: PeopleOutlineIcon, color: '#ff6f00' },
                  { title: 'Login Sessions', value: stats?.loginCount ?? 0, icon: LoginIcon, color: '#9c27b0' }
                ].map((stat, index) => (
                  <Grid item xs={6} md={3} key={stat.title}>
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <StatCard>
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <Box sx={{ 
                            width: 60, 
                            height: 60, 
                            borderRadius: '50%', 
                            bgcolor: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2
                          }}>
                            <stat.icon sx={{ color: 'white', fontSize: 30 }} />
                          </Box>
                          <Typography variant="h4" fontWeight={800} color="primary.main">
                            <CountUp end={stat.value} duration={2} />
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {stat.title}
                          </Typography>
                        </CardContent>
                      </StatCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {/* Charts */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <ChartCard>
                      <CardContent sx={{ p: 2.5, height: '100%' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Views & Applications Trend
                        </Typography>
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={combinedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="count" 
                              stackId="1"
                              stroke="#1976d2" 
                              fill="url(#colorViews)"
                              name="Views"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="applications" 
                              stackId="2"
                              stroke="#ff6f00" 
                              fill="url(#colorApps)"
                              name="Applications"
                            />
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff6f00" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ff6f00" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </ChartCard>
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                   <ChartCard>
  <CardContent sx={{ p: 2.5, height: '100%' }}>
    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
      Performance Overview
    </Typography>

    {/* Add more vertical space for a larger chart */}
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%" // center chart vertically
          innerRadius={70} // thicker donut
          outerRadius={120} // bigger pie
          paddingAngle={5}
          dataKey="value"
          nameKey="name"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>

    {/* Manual legend BELOW the chart with extra margin */}
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      mt={3} // increase margin-top
    >
      {pieData.map((item, index) => (
        <Box
          key={index}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              bgcolor: item.color,
              borderRadius: '50%',
            }}
          />
          <Typography variant="caption">{item.name}</Typography>
        </Box>
      ))}
    </Stack>
  </CardContent>
</ChartCard>
                  </motion.div>
                </Grid>
              </Grid>

              {/* Jobs Table */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <TableCard>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Your Posted Jobs
                    </Typography>
                    {jobs.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <WorkIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1.5 }} />
                        <Typography variant="body1" color="text.secondary">
                          No jobs posted yet. Create your first job posting!
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Job Title</TableCell>
                              <TableCell>Company</TableCell>
                              <TableCell align="center">Applications</TableCell>
                              <TableCell align="center">Views</TableCell>
                              <TableCell align="center">Posted Date</TableCell>
                              <TableCell align="center">Performance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {jobs.map((job, index) => {
                              const conversionRate = job.views > 0 ? ((job.applicationsCount / job.views) * 100).toFixed(1) : '0';
                              return (
                                <motion.tr
                                  key={job.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <TableCell>
                                    <Typography fontWeight={600}>{job.title}</Typography>
                                  </TableCell>
                                  <TableCell>{job.company}</TableCell>
                                  <TableCell align="center">
                                    <Chip 
                                      label={job.applicationsCount} 
                                      color="primary"
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
                                      <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography>{job.views}</Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography variant="body2">
                                      {new Date(job.createdAt).toLocaleDateString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
                                      <Typography variant="body2" fontWeight={600}>
                                        {conversionRate}%
                                      </Typography>
                                      {parseFloat(conversionRate) > 5 ? 
                                        <ArrowUpwardIcon sx={{ fontSize: 16, color: 'success.main' }} /> :
                                        <ArrowDownwardIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                      }
                                    </Stack>
                                  </TableCell>
                                </motion.tr>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </TableCard>
              </motion.div>

              {/* Top Performing Jobs and Quick Insights for Mobile */}
              {isMobile && (
                <>
                  {topPerformingJobsSection}
                  {quickInsights}
                </>
              )}
            </Stack>
          </Grid>

          {/* Right Sidebar for Desktop */}
          {!isMobile && (
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                {quickActions}
                {topPerformingJobsSection}
                {quickInsights}
              </Stack>
            </Grid>
          )}
        </Grid>
      </DashboardContainer>
    </motion.div>
  );
}