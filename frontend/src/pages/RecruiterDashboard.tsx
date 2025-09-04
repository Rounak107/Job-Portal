import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { Link as RouterLink } from 'react-router-dom';
import CountUp from 'react-countup';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Box, Typography, Avatar, Button, Grid, CircularProgress,
  Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Container, Stack, Fade, useMediaQuery, useTheme
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkIcon from '@mui/icons-material/Work';
import LoginIcon from '@mui/icons-material/Login';
import AnalyticsIcon from '@mui/icons-material/Analytics';
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
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.9) 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 14px 28px rgba(0,0,0,0.08)',
  }
}));

const StatCard = styled(StyledCard)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
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
  background: `linear-gradient(135deg, #0a1929ff 0%, #333333 100%)`,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    transform: 'translateY(-6px) scale(1.01)',
  }
}));

const ActionCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
  color: theme.palette.secondary.contrastText,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  textDecoration: 'none',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.03)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
    textDecoration: 'none',
  }
}));

const ChartCard = styled(StyledCard)(({ theme }) => ({
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
      fontWeight: 700,
      backgroundColor: theme.palette.action.hover,
      borderBottom: `2px solid ${theme.palette.primary.main}`,
    }
  },
  '& .MuiTableRow-root': {
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'scale(1.005)',
    }
  }
}));

const GlowingAvatar = styled(Avatar)(({ theme }) => ({
  width: 72,
  height: 72,
  fontSize: '1.8rem',
  fontWeight: 'bold',
  background: `linear-gradient(45deg, ${theme.palette.background.paper}, ${theme.palette.primary.light})`,
  color: theme.palette.primary.main,
  border: `3px solid ${theme.palette.primary.main}`,
  boxShadow: `0 0 16px ${theme.palette.primary.main}40`,
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
        borderRadius: 1.5,
        boxShadow: 3
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

type Profile = {
  name?: string;
  email?: string;
};

type Stats = {
  jobCount?: number;
  totalApplications?: number;
  totalViews?: number;
  loginCount?: number;
};

type AnalyticsItem = {
  month: string;
  count: number;
};

type ApiResponse = {
  profile: Profile;
  stats: Stats;
  jobs: JobRow[];
  analytics?: {
    viewsByMonth: AnalyticsItem[];
    appsByMonth: AnalyticsItem[];
  };
};

export default function RecruiterDashboard() {
  useAuth(); // keep auth context active (even if unused here)
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.get('/recruiter/me', { signal: controller.signal });
        setData(res.data);
        setError(null);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <DashboardContainer maxWidth="xl">
        <StyledCard sx={{ p: 4, textAlign: 'center' }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={56} thickness={4} />
            <Typography variant="h6" color="text.secondary">
              Loading your dashboard...
            </Typography>
            <LinearProgress sx={{ width: 280, borderRadius: 2, height: 6 }} />
          </Stack>
        </StyledCard>
      </DashboardContainer>
    );
  }

  if (error || !data) {
    return (
      <DashboardContainer maxWidth="xl">
        <StyledCard sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || 'Failed to load dashboard'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 1.5 }}>
            Retry
          </Button>
        </StyledCard>
      </DashboardContainer>
    );
  }

  const profile = data.profile;
  const stats = data.stats || {};
  const jobs: JobRow[] = data.jobs || [];
  const viewsByMonth = data.analytics?.viewsByMonth || [];
  const appsByMonth = data.analytics?.appsByMonth || [];

  const combinedData = useMemo(
    () =>
      viewsByMonth.map((item: AnalyticsItem, index: number) => ({
        ...item,
        applications: appsByMonth[index]?.count || 0
      })),
    [viewsByMonth, appsByMonth]
  );

  const pieData = useMemo(
    () => [
      { name: 'Active Jobs', value: stats?.jobCount || 0, color: '#1976d2' },
      { name: 'Total Applications', value: stats?.totalApplications || 0, color: '#ff6f00' },
      { name: 'Profile Views', value: stats?.totalViews || 0, color: '#4caf50' }
    ],
    [stats]
  );

  const topPerformingJobs = useMemo(
    () =>
      [...jobs].sort((a, b) => b.applicationsCount - a.applicationsCount).slice(0, 3),
    [jobs]
  );

  // Reusable Quick Actions
  const QuickActions = React.memo(() => (
    <Stack spacing={1.5}>
      <ActionCard component={RouterLink} to="/jobs/new">
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AddCircleOutlineIcon sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Create Job
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Post a new job opening
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </ActionCard>

      <ActionCard component={RouterLink} to="/recruiter/applicants">
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <PeopleOutlineIcon sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                View Applicants
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Review job applications
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </ActionCard>
    </Stack>
  ));

  // Insights Section Component
  const InsightsSection = React.memo(() => (
    <StyledCard>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <AnalyticsIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Quick Insights
          </Typography>
        </Stack>
        <Stack spacing={1.25}>
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="body2" fontWeight={600}>
              Avg. applications per job: {jobs.length > 0 ? Math.round((stats?.totalApplications || 0) / jobs.length) : 0}
            </Typography>
          </Box>
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="body2" fontWeight={600}>
              Avg. views per job: {jobs.length > 0 ? Math.round((stats?.totalViews || 0) / jobs.length) : 0}
            </Typography>
          </Box>
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="body2" fontWeight={600}>
              Conversion rate: {stats?.totalViews ? (((stats?.totalApplications || 0) / stats.totalViews) * 100).toFixed(1) : 0}%
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </StyledCard>
  ));

  // Top Performing Jobs Component
  const TopJobsSection = React.memo(() => (
    <StyledCard>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Top Performing Jobs
        </Typography>
        {topPerformingJobs.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            No job performance data yet
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {topPerformingJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Box sx={{
                  p: 1.25,
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
                                  <Chip label={`#${index + 1}`} size="small" color="primary" />
                                </Stack>
                              </Box>
                            </motion.div>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </StyledCard>
                </motion.div>

                {/* Analytics Insights */}
                <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.45 }}>
                  <StyledCard>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <AnalyticsIcon color="primary" />
                        <Typography variant="h6" fontWeight={700}>
                          Quick Insights
                        </Typography>
                      </Stack>
                      <Stack spacing={1.25}>
                        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                          <Typography variant="body2" fontWeight={600}>
                            Avg. applications per job: {jobs.length > 0 ? Math.round((stats?.totalApplications || 0) / jobs.length) : 0}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                          <Typography variant="body2" fontWeight={600}>
                            Avg. views per job: {jobs.length > 0 ? Math.round((stats?.totalViews || 0) / jobs.length) : 0}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                          <Typography variant="body2" fontWeight={600}>
                            Conversion rate: {stats?.totalViews ? (((stats?.totalApplications || 0) / stats.totalViews) * 100).toFixed(1) : 0}%
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </StyledCard>
                </motion.div>
              </Stack>
            </Grid>
          )}
        </Grid>

        {/* Charts - tightened spacing to reduce gaps */}
        <Box sx={{ mt: 1.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }}>
                <ChartCard>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Views & Applications Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height={220}>
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
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }}>
                <ChartCard>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Performance Overview
                    </Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={56}
                          outerRadius={92}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Stack direction="row" spacing={2} justifyContent="center" mt={1} flexWrap="wrap" useFlexGap>
                      {pieData.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%' }} />
                          <Typography variant="caption">{item.name}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </ChartCard>
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        {/* Jobs Table */}
        <Box sx={{ mt: 1.5 }}>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}>
            <TableCard>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Your Posted Jobs
                </Typography>
                {jobs.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <WorkIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 1.5 }} />
                    <Typography variant="body1" color="text.secondary">
                      No jobs posted yet. Create your first job posting!
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="medium">
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
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(index * 0.06, 0.6) }}
                            >
                              <TableCell>
                                <Typography fontWeight={600}>{job.title}</Typography>
                              </TableCell>
                              <TableCell>{job.company}</TableCell>
                              <TableCell align="center">
                                <Chip label={job.applicationsCount} color="primary" size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" alignItems="center" spacing={0.75} justifyContent="center">
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
        </Box>

        {/* Mobile Only - Top Jobs and Insights (moved to bottom as requested) */}
        {isMobile && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <StyledCard>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Top Performing Jobs
                    </Typography>
                    {topPerformingJobs.length === 0 ? (
                      <Typography color="text.secondary" sx={{ py: 1 }}>
                        No job performance data yet
                      </Typography>
                    ) : (
                      <Stack spacing={1.25}>
                        {topPerformingJobs.map((job, index) => (
                          <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                          >
                            <Box sx={{
                              p: 1.25,
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
                                <Chip label={`#${index + 1}`} size="small" color="primary" />
                              </Stack>
                            </Box>
                          </motion.div>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>

              <Grid item xs={12}>
                <StyledCard>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <AnalyticsIcon color="primary" />
                      <Typography variant="h6" fontWeight={700}>
                        Quick Insights
                      </Typography>
                    </Stack>
                    <Stack spacing={1.25}>
                      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="body2" fontWeight={600}>
                          Avg. applications per job: {jobs.length > 0 ? Math.round((stats?.totalApplications || 0) / jobs.length) : 0}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                        <Typography variant="body2" fontWeight={600}>
                          Avg. views per job: {jobs.length > 0 ? Math.round((stats?.totalViews || 0) / jobs.length) : 0}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <Typography variant="body2" fontWeight={600}>
                          Conversion rate: {stats?.totalViews ? (((stats?.totalApplications || 0) / stats.totalViews) * 100).toFixed(1) : 0}%
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          </Box>
        )}
      </DashboardContainer>
    </motion.div>
  );
}