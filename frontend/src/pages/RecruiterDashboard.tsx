// frontend/src/pages/RecruiterDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { Link as RouterLink } from 'react-router-dom';
import CountUp from 'react-countup';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Box, Typography, Avatar, Button, Grid, CircularProgress,
  Card, CardContent, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, Container, Stack
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

// Animated background
const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const DashboardContainer = styled(Container)(({ theme }) => ({
  background: `linear-gradient(-45deg, ${theme.palette.background.default}, ${theme.palette.action.hover}, ${theme.palette.background.paper})`,
  backgroundSize: '400% 400%',
  animation: `${gradientShift} 15s ease infinite`,
  minHeight: '100vh',
  // compact top spacing under AppBar
  paddingTop: `calc(64px + ${theme.spacing(1.5)})`,
  paddingBottom: theme.spacing(2),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: theme.palette.background.paper,
  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.25s ease',
  height: '100%',
}));

const StatCard = styled(StyledCard)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ActionCard = styled(StyledCard)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.25s ease',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'block',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
    textDecoration: 'none',
  }
}));

const ChartCard = styled(StyledCard)(({ theme }) => ({
  padding: theme.spacing(2),
  '& .recharts-cartesian-grid-horizontal line': {
    stroke: theme.palette.divider,
  },
  '& .recharts-cartesian-grid-vertical line': {
    stroke: theme.palette.divider,
  }
}));

const TableCard = styled(StyledCard)(({ theme }) => ({
  '& .MuiTableHead-root .MuiTableCell-root': {
    fontWeight: 700,
    backgroundColor: theme.palette.grey[50],
    borderBottom: `2px solid ${theme.palette.divider}`,
  },
  '& .MuiTableRow-root': {
    transition: 'all 0.2s ease',
    '&:hover': { backgroundColor: theme.palette.action.hover }
  }
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
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" color="primary">Views: {payload[0].value}</Typography>
        <Typography variant="body2" color="secondary">Applications: {payload[1].value}</Typography>
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
  const { user } = useAuth(); // kept for parity; not directly used
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
      applications: appsByMonth[index]?.count || 0
    })),
    [viewsByMonth, appsByMonth]
  );

  const pieData = useMemo(() => [
    { name: 'Active Jobs', value: stats?.jobCount || 0, color: '#1976d2' },
    { name: 'Total Applications', value: stats?.totalApplications || 0, color: '#ff6f00' },
    { name: 'Profile Views', value: stats?.totalViews || 0, color: '#4caf50' }
  ], [stats]);

  const topPerformingJobs = useMemo(
    () => [...jobs].sort((a: JobRow, b: JobRow) => b.applicationsCount - a.applicationsCount).slice(0, 3),
    [jobs]
  );

  if (loading) {
    return (
      <DashboardContainer maxWidth="xl">
        <StyledCard sx={{ p: 4, textAlign: 'center' }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={56} thickness={4} />
            <Typography variant="h6" color="text.secondary">Loading your dashboard...</Typography>
            <LinearProgress sx={{ width: 280, borderRadius: 2, height: 6 }} />
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <DashboardContainer maxWidth="xl">
        {/* Row 1: Stats (full width, compact) */}
        <Grid container spacing={2} sx={{ mb: 1 }}>
          {[
            { title: 'Jobs Posted', value: stats?.jobCount ?? 0, icon: WorkIcon, color: '#1976d2' },
            { title: 'Total Views', value: stats?.totalViews ?? 0, icon: VisibilityIcon, color: '#4caf50' },
            { title: 'Applications', value: stats?.totalApplications ?? 0, icon: PeopleOutlineIcon, color: '#ff6f00' },
            { title: 'Login Sessions', value: stats?.loginCount ?? 0, icon: LoginIcon, color: '#9c27b0' }
          ].map((stat, index) => (
            <Grid item xs={6} md={3} key={stat.title}>
              <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: index * 0.05 }}>
                <StatCard>
                  <Stack alignItems="center" spacing={1}>
                    <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 56, height: 56 }}>
                      <stat.icon />
                    </Avatar>
                    <Typography variant="h4" fontWeight={800} color="text.primary" lineHeight={1.1}>
                      <CountUp end={stat.value} duration={1.4} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {stat.title}
                    </Typography>
                  </Stack>
                </StatCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Row 2: Charts (left) + Sidebar (right) */}
        <Grid container spacing={2}>
          {/* Left: two charts side-by-side */}
          <Grid item xs={12} lg={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                  <ChartCard>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Views & Applications Trend
                    </Typography>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
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
                    </Box>
                  </ChartCard>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
                  <ChartCard>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Performance Overview
                    </Typography>
                    <Box sx={{ height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" mt={1}>
                        {pieData.map((item, index) => (
                          <Chip
                            key={index}
                            label={item.name}
                            size="small"
                            sx={{ bgcolor: `${item.color}20`, color: 'text.primary', fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </ChartCard>
                </motion.div>
              </Grid>
            </Grid>
          </Grid>

          {/* Right: Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              {/* Quick Actions (compact, no heading) */}
              <motion.div initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <Stack spacing={1.5}>
                  <ActionCard component={RouterLink} to="/recruiter/applicants" sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
                    <CardContent sx={{ p: 2.25 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'white', color: 'secondary.main', width: 40, height: 40 }}>
                          <PeopleOutlineIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={700}>View Applicants</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>Review job applications</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </ActionCard>

                  <ActionCard component={RouterLink} to="/jobs/new">
                    <CardContent sx={{ p: 2.25 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 40, height: 40 }}>
                          <AddCircleOutlineIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={700}>Create Job</Typography>
                          <Typography variant="body2" color="text.secondary">Post a new job opening</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </ActionCard>
                </Stack>
              </motion.div>

              {/* Top Performing Jobs */}
              <motion.div initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
                <StyledCard>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Top Performing Jobs</Typography>
                    {topPerformingJobs.length === 0 ? (
                      <Typography color="text.secondary" sx={{ py: 1 }}>No job performance data yet</Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {topPerformingJobs.map((job: JobRow, index: number) => (
                          <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="body1" fontWeight={700} gutterBottom>{job.title}</Typography>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center">
                                  <PeopleOutlineIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2">{job.applicationsCount} applications</Typography>
                                </Box>
                                <Chip label={`#${index + 1}`} size="small" color="primary" variant="outlined" />
                              </Box>
                            </Box>
                          </motion.div>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </StyledCard>
              </motion.div>

              {/* Quick Insights */}
              <motion.div initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
                <StyledCard>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AnalyticsIcon color="primary" />
                      <Typography variant="h6" fontWeight={700}>Quick Insights</Typography>
                    </Box>
                    <Stack spacing={1.2}>
                      <Chip
                        label={`Average applications per job: ${jobs.length > 0 ? Math.round((stats?.totalApplications || 0) / jobs.length) : 0}`}
                        sx={{ bgcolor: '#43a047', color: 'white', fontWeight: 700 }}
                      />
                      <Chip
                        label={`Average views per job: ${jobs.length > 0 ? Math.round((stats?.totalViews || 0) / jobs.length) : 0}`}
                        sx={{ bgcolor: '#0288d1', color: 'white', fontWeight: 700 }}
                      />
                      <Chip
                        label={`Overall conversion rate: ${stats?.totalViews > 0 ? ((stats?.totalApplications || 0) / stats.totalViews * 100).toFixed(1) : 0}%`}
                        sx={{ bgcolor: '#fb8c00', color: 'white', fontWeight: 700 }}
                      />
                    </Stack>
                  </CardContent>
                </StyledCard>
              </motion.div>
            </Stack>
          </Grid>
        </Grid>

        {/* Row 3: Jobs table (full width) */}
        <Box mt={2}>
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.25 }}>
            <TableCard>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Your Posted Jobs</Typography>
                {jobs.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <WorkIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">No jobs posted yet. Create your first job posting!</Typography>
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/jobs/new"
                      startIcon={<AddCircleOutlineIcon />}
                      sx={{ mt: 2 }}
                    >
                      Create Job
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Job Title</TableCell>
                          <TableCell>Applications</TableCell>
                          <TableCell>Views</TableCell>
                          <TableCell>Posted Date</TableCell>
                          <TableCell align="center">Performance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {jobs.map((job: JobRow, index: number) => {
                          const conversionRate = job.views > 0 ? ((job.applicationsCount / job.views) * 100).toFixed(1) : '0';
                          return (
                            <TableRow
                              key={job.id}
                              component={motion.tr}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <TableCell>
                                <Typography fontWeight={700}>{job.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{job.company}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={job.applicationsCount} color="primary" size="small" />
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                  <Typography>{job.views}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {new Date(job.createdAt).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center">
                                  <Typography variant="body2" fontWeight={700} sx={{ mr: 0.5 }}>
                                    {conversionRate}%
                                  </Typography>
                                  {parseFloat(conversionRate) > 5
                                    ? <ArrowUpwardIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                    : <ArrowDownwardIcon sx={{ fontSize: 16, color: 'warning.main' }} />
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
          </motion.div>
        </Box>
      </DashboardContainer>
    </motion.div>
  );
}