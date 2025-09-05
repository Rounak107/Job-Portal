// frontend/src/pages/RecruiterDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { Link as RouterLink } from 'react-router-dom';
import CountUp from 'react-countup';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import {
  Box, Paper, Typography, Button, Grid, CircularProgress,
  Card, CardContent, Chip, Container, Stack, LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkIcon from '@mui/icons-material/Work';
import LoginIcon from '@mui/icons-material/Login';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// Styled Components
const DashboardContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  backgroundColor: theme.palette.grey[50],
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: theme.palette.background.paper,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  }
}));

const StatCard = styled(StyledCard)({
  textAlign: 'center',
  padding: '24px 16px',
});

const StatIconContainer = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  margin: '0 auto 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.common.white,
}));

const ChartCard = styled(StyledCard)(({ theme }) => ({
  padding: theme.spacing(3),
}));

// Custom Tooltip for Area Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" sx={{ color: '#1976d2' }}>
          Views: {payload[1]?.value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#ff6f00' }}>
          Applications: {payload[0]?.value}
        </Typography>
      </Paper>
    );
  }
  return null;
};

// Custom Legend for Pie Chart
const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
      {payload.map((entry: any, index: number) => (
        <Box key={`item-${index}`} display="flex" alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: entry.color,
              mr: 1,
            }}
          />
          <Typography variant="caption">{entry.value}</Typography>
        </Box>
      ))}
    </Stack>
  );
};


type JobRow = {
  id: number;
  title: string;
  applicationsCount: number;
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.get('/recruiter/me');
        setData(res.data);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Memoize computed values
  const { stats, jobs, viewsByMonth, appsByMonth } = useMemo(() => {
    if (!data) return { stats: null, jobs: [], viewsByMonth: [], appsByMonth: [] };
    return {
      stats: data.stats,
      jobs: data.jobs || [],
      viewsByMonth: data.analytics?.viewsByMonth || [],
      appsByMonth: data.analytics?.appsByMonth || []
    };
  }, [data]);

  const combinedData = useMemo(() =>
    viewsByMonth.map((item: any, index: number) => ({
      ...item,
      applications: appsByMonth[index]?.count || 0,
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

  const quickInsights = [
      { 
          label: 'Average applications per job', 
          value: jobs.length > 0 ? Math.round((stats?.totalApplications || 0) / jobs.length) : 0,
          color: 'success.main'
      },
      { 
          label: 'Average views per job', 
          value: jobs.length > 0 ? Math.round((stats?.totalViews || 0) / jobs.length) : 0,
          color: 'primary.main'
      },
      { 
          label: 'Overall conversion rate', 
          value: `${stats?.totalViews > 0 ? ((stats?.totalApplications || 0) / stats.totalViews * 100).toFixed(1) : 0}%`,
          color: 'warning.main'
      },
  ];

  if (loading) {
    return (
      <DashboardContainer maxWidth="xl">
        <StyledCard sx={{ p: 4, textAlign: 'center' }}>
          <Stack alignItems="center" spacing={3}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">Loading your dashboard...</Typography>
            <LinearProgress sx={{ width: 300, borderRadius: 2, height: 8 }} />
          </Stack>
        </StyledCard>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer maxWidth="xl">
        <StyledCard sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>{error}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>Retry</Button>
        </StyledCard>
      </DashboardContainer>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <DashboardContainer maxWidth="xl">
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Stats Grid */}
              <Grid container spacing={3}>
                {[
                  { title: 'Jobs Posted', value: stats?.jobCount ?? 0, icon: WorkIcon, color: '#1976d2' },
                  { title: 'Total Views', value: stats?.totalViews ?? 0, icon: VisibilityIcon, color: '#4caf50' },
                  { title: 'Applications', value: stats?.totalApplications ?? 0, icon: PeopleOutlineIcon, color: '#ff6f00' },
                  { title: 'Login Sessions', value: stats?.loginCount ?? 0, icon: LoginIcon, color: '#9c27b0' }
                ].map((stat, index) => (
                  <Grid item xs={6} md={3} key={stat.title}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                      <StatCard>
                        <StatIconContainer sx={{ bgcolor: stat.color }}>
                          <stat.icon sx={{ fontSize: 32 }} />
                        </StatIconContainer>
                        <Typography variant="h4" fontWeight={800}>
                          <CountUp end={stat.value} duration={2} />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </StatCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {/* Charts */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <ChartCard>
                      <Typography variant="h6" fontWeight={700} gutterBottom>Views & Applications Trend</Typography>
                      <Box sx={{ height: 300, mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="applications" stackId="1" stroke="#ff6f00" fill="#ff6f00" fillOpacity={0.3} />
                            <Area type="monotone" dataKey="count" name="Views" stackId="1" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </ChartCard>
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={5}>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
                    <ChartCard>
                      <Typography variant="h6" fontWeight={700} gutterBottom>Performance Overview</Typography>
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="45%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Legend content={renderLegend} verticalAlign="bottom" />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </ChartCard>
                  </motion.div>
                </Grid>
              </Grid>
            </Stack>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Quick Actions */}
               <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                  <StyledCard
                    component={RouterLink}
                    to="/recruiter/applicants"
                    sx={{ textDecoration: 'none', bgcolor: '#673ab7', color: 'white', '&:hover': { bgcolor: '#5e35b1' } }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                          <PeopleOutlineIcon />
                        <Box>
                          <Typography variant="body1" fontWeight={600}>View Applicants</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>Review job applications</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </StyledCard>
              </motion.div>
              
              {/* Top Performing Jobs */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <StyledCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Top Performing Jobs</Typography>
                    {topPerformingJobs.length === 0 ? (
                      <Typography color="text.secondary" sx={{ py: 2 }}>No job performance data yet</Typography>
                    ) : (
                      <Stack spacing={2}>
                        {topPerformingJobs.map((job: JobRow, index: number) => (
                          <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.100' }}>
                              <Typography variant="body1" fontWeight={600} gutterBottom>{job.title}</Typography>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center">
                                  <PeopleOutlineIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2">{job.applicationsCount} applications</Typography>
                                </Box>
                                <Chip label={`#${index + 1}`} size="small" color="primary" />
                              </Box>
                            </Box>
                          </motion.div>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </StyledCard>
              </motion.div>

              {/* Analytics Insights */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <StyledCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AnalyticsIcon color="primary" />
                      <Typography variant="h6" fontWeight={700}>Quick Insights</Typography>
                    </Box>
                    <Stack spacing={1.5}>
                        {quickInsights.map((insight, index) => (
                            <Box 
                                key={index} 
                                sx={{ 
                                    p: 1.5, 
                                    borderRadius: 2, 
                                    bgcolor: insight.color,
                                    color: 'common.white',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="body2" fontWeight={600}>{insight.label}</Typography>
                                <Typography variant="body2" fontWeight={700}>{insight.value}</Typography>
                            </Box>
                        ))}
                    </Stack>
                  </CardContent>
                </StyledCard>
              </motion.div>
            </Stack>
          </Grid>
        </Grid>
      </DashboardContainer>
    </motion.div>
  );
}