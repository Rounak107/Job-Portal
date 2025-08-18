// frontend/src/components/JobsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

import {
  Box,
  Grid,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  Skeleton,
  Pagination,
  useTheme,
  alpha,
  IconButton,
  Fade,
  Zoom,
  Container,
  InputAdornment,
  Badge,
  Tooltip,
  Grow,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import PaidIcon from '@mui/icons-material/Paid';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { keyframes } from '@mui/system';

type Job = {
  id: number;
  title: string;
  description: string;
  company: string;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  workMode?: 'OFFICE' | 'HOME' | 'REMOTE' | 'HYBRID';
  role?: string | null;
  postedBy?: { id: number; name: string; email: string };
};

const WORK_MODE_LABEL: Record<string, string> = {
  OFFICE: 'Work from Office',
  HOME: 'Work from Home',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

const WORK_MODE_ICONS: Record<string, React.ReactElement> = {
  OFFICE: <ApartmentIcon />,
  HOME: <HomeWorkIcon />,
  REMOTE: <PublicIcon />,
  HYBRID: <GroupWorkIcon />,
};

// Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function JobsPage() {
  const theme = useTheme();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
  const [filterOpen, setFilterOpen] = useState(true);

  // filters & lists from backend
  const [companies, setCompanies] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [workModes, setWorkModes] = useState<string[]>([]);

  // UI filter state
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [minSalary, setMinSalary] = useState<string>('');
  const [maxSalary, setMaxSalary] = useState<string>('');

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  // small debounce for search typing
  useEffect(() => {
    const t = setTimeout(() => {
      loadJobs(1);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, company, location, role, workMode, minSalary, maxSalary]);

  // initial load: filters + first page
  useEffect(() => {
    loadFilters();
    loadJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFilters() {
    try {
      const res = await api.get('/jobs/filters');
      const data = res.data || {};
      setCompanies(data.companies || []);
      setLocations(data.locations || []);
      setRoles(data.roles || []);
      setWorkModes(data.workModes || []);
    } catch (err) {
      console.warn('Failed to fetch filters, falling back to minimal lists', err);
    }
  }

  async function loadJobs(requestedPage = page) {
    setLoading(true);
    try {
      const params: any = {
        page: requestedPage,
        limit: pageSize,
      };
      if (search?.trim()) params.search = search.trim();
      if (company) params.company = company;
      if (location) params.location = location;
      if (role) params.role = role;
      if (workMode) params.workMode = workMode;
      if (minSalary) params.minSalary = Number(minSalary);
      if (maxSalary) params.maxSalary = Number(maxSalary);

      const res = await api.get('/jobs', { params });
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || requestedPage);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch('');
    setCompany('');
    setLocation('');
    setRole('');
    setWorkMode('');
    setMinSalary('');
    setMaxSalary('');
    setPage(1);
    loadJobs(1);
  }

  const toggleSaveJob = (jobId: number) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const currency = (v?: number | null) => (typeof v === 'number' ? `₹${v.toLocaleString()}` : '—');

  const activeFiltersCount = [company, location, role, workMode, minSalary, maxSalary].filter(Boolean).length;

  const JobSkeleton = () => (
    <Card sx={{ 
      mb: 3,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      animation: `${float} 3s ease-in-out infinite`,
    }}>
      <CardContent sx={{ p: 3 }}>
        <Skeleton width="60%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        <Skeleton width="30%" sx={{ bgcolor: 'rgba(255,255,255,0.2)', mt: 1 }} />
        <Stack direction="row" spacing={2} mt={2}>
          <Skeleton width={100} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton width={140} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        </Stack>
        <Skeleton variant="rectangular" height={60} sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
    }}>
      {/* Hero Section with Search */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8,
        px: 3,
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          animation: `${float} 6s ease-in-out infinite`,
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          animation: `${float} 8s ease-in-out infinite`,
        }} />
        
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Stack spacing={3} alignItems="center" position="relative">
              <Typography variant="h2" sx={{
                fontWeight: 900,
                color: '#fff',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}>
                Find Your Dream Job
              </Typography>
              <Typography variant="h6" sx={{
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                maxWidth: 600,
              }}>
                Discover thousands of opportunities from top companies worldwide
              </Typography>

              <Paper sx={{
                p: 1,
                borderRadius: 4,
                width: '100%',
                maxWidth: 700,
                backdropFilter: 'blur(10px)',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    placeholder="Search by job title, company, or keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: theme.palette.primary.main }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 3,
                        '& fieldset': { border: 'none' },
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => loadJobs(1)}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(102,126,234,0.6)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Search
                  </Button>
                </Stack>
              </Paper>

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Chip
                  icon={<TrendingUpIcon />}
                  label=" New jobs this week"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Chip
                  label="Remote opportunities available"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    backdropFilter: 'blur(10px)',
                  }}
                />
              </Stack>
            </Stack>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* LEFT: Filters */}
          <Grid item xs={12} md={3}>
            <Zoom in timeout={500}>
              <Paper sx={{
                p: 3,
                borderRadius: 3,
                position: 'sticky',
                top: 24,
                height: 'fit-content',
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                animation: `${slideIn} 0.5s ease-out`,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '10px',
                },
              }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FilterListIcon sx={{ color: theme.palette.primary.main }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Filters
                      </Typography>
                    </Stack>
                    {activeFiltersCount > 0 && (
                      <Badge badgeContent={activeFiltersCount} color="primary" />
                    )}
                  </Stack>

                  <FormControl fullWidth size="small">
                    <InputLabel>Company</InputLabel>
                    <Select
                      label="Company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <MenuItem value="">All companies</MenuItem>
                      {companies.map((c) => (
                        <MenuItem key={c} value={c}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <BusinessIcon fontSize="small" />
                            <span>{c}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Location</InputLabel>
                    <Select
                      label="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <MenuItem value="">All locations</MenuItem>
                      {locations.map((l) => (
                        <MenuItem key={l} value={l}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LocationOnIcon fontSize="small" />
                            <span>{l}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      label="Role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <MenuItem value="">All roles</MenuItem>
                      {roles.map((r) => (
                        <MenuItem key={r} value={r}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <WorkIcon fontSize="small" />
                            <span>{r}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Work mode</InputLabel>
                    <Select
                      label="Work mode"
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <MenuItem value="">Any</MenuItem>
                      {workModes.map((wm) => (
                        <MenuItem key={wm} value={wm}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {WORK_MODE_ICONS[wm]}
                            <span>{WORK_MODE_LABEL[wm] || wm}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    Salary Range
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      label="Min salary"
                      type="number"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      fullWidth
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PaidIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }}
                    />
                    <TextField
                      label="Max salary"
                      type="number"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value)}
                      fullWidth
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PaidIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }}
                    />
                  </Stack>

                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => loadJobs(1)}
                      sx={{
                        borderRadius: 2,
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
                      Apply Filters
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={clearFilters}
                      startIcon={<ClearIcon />}
                      sx={{
                        borderRadius: 2,
                        py: 1,
                        borderColor: theme.palette.divider,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          background: alpha(theme.palette.primary.main, 0.05),
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Clear All
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    Quick Filters
                  </Typography>
                  <Stack spacing={1}>
                    {['REMOTE', 'HOME', 'OFFICE', 'HYBRID'].map((mode) => (
                      <Chip
                        key={mode}
                        icon={WORK_MODE_ICONS[mode]}
                        label={WORK_MODE_LABEL[mode]}
                        clickable
                        onClick={() => setWorkMode(mode)}
                        sx={{
                          justifyContent: 'flex-start',
                          py: 2.5,
                          background: workMode === mode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                          color: workMode === mode ? '#fff' : 'inherit',
                          border: '1px solid',
                          borderColor: workMode === mode ? 'transparent' : theme.palette.divider,
                          '&:hover': {
                            background: workMode === mode 
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : alpha(theme.palette.primary.main, 0.1),
                            transform: 'translateX(5px)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Zoom>
          </Grid>

          {/* RIGHT: Job Listings */}
          <Grid item xs={12} md={9}>
            <Stack spacing={3}>
              {/* Results Header */}
              <Fade in timeout={700}>
                <Paper sx={{
                  p: 2,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h5" fontWeight={700}>
                        {total} Jobs Found
                      </Typography>
                      {loading && (
                        <Box sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          border: '3px solid',
                          borderColor: theme.palette.primary.main,
                          borderTopColor: 'transparent',
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }} />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Page {page} of {totalPages}
                    </Typography>
                  </Stack>
                </Paper>
              </Fade>

              {/* Job Cards */}
              {loading ? (
                <>
                  <JobSkeleton />
                  <JobSkeleton />
                  <JobSkeleton />
                </>
              ) : jobs.length === 0 ? (
                <Fade in timeout={500}>
                  <Paper sx={{
                    p: 8,
                    textAlign: 'center',
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                  }}>
                    <Box sx={{
                      width: 120,
                      height: 120,
                      margin: '0 auto 2rem',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: `${float} 3s ease-in-out infinite`,
                    }}>
                      <WorkIcon sx={{ fontSize: 60, color: '#fff' }} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      No jobs match your filters
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Try adjusting your search criteria or clearing filters to see more results.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={clearFilters}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(102,126,234,0.6)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Paper>
                </Fade>
              ) : (
                jobs.map((job, index) => (
                  <Grow in timeout={500 + index * 100} key={job.id}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        position: 'relative',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        animation: `${fadeIn} 0.5s ease-out`,
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                          '& .job-arrow': {
                            transform: 'translateX(5px)',
                          },
                          '& .job-gradient': {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      {/* Gradient overlay on hover */}
                      <Box
                        className="job-gradient"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        }}
                      />

                      <CardActionArea component={Link} to={`/jobs/${job.id}_${slugify(job.title)}`}>
                        <CardContent sx={{ p: 3 }}>
                          <Stack spacing={2}>
                            {/* Header with title and save button */}
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box flex={1}>
                                <Typography variant="h5" fontWeight={800} gutterBottom sx={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}>
                                  {job.title}
                                </Typography>

                                <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <BusinessIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                                    <Typography variant="body2" fontWeight={600}>
                                      {job.company}
                                    </Typography>
                                  </Stack>

                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <LocationOnIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {job.location}
                                    </Typography>
                                  </Stack>

                                  {job.role && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <WorkIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                                      <Typography variant="body2" color="text.secondary">
                                        {job.role}
                                      </Typography>
                                    </Stack>
                                  )}
                                </Stack>
                              </Box>

                              <IconButton
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleSaveJob(job.id);
                                }}
                                sx={{
                                  '&:hover': {
                                    transform: 'scale(1.2)',
                                  },
                                  transition: 'transform 0.2s ease',
                                }}
                              >
                                {savedJobs.has(job.id) ? (
                                  <BookmarkIcon sx={{ color: theme.palette.primary.main }} />
                                ) : (
                                  <BookmarkBorderIcon />
                                )}
                              </IconButton>
                            </Stack>

                            {/* Tags */}
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              {job.workMode && (
                                <Chip
                                  icon={WORK_MODE_ICONS[job.workMode]}
                                  label={WORK_MODE_LABEL[job.workMode] || job.workMode}
                                  size="small"
                                  sx={{
                                    borderRadius: 2,
                                    background: alpha(theme.palette.primary.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                    '& .MuiChip-icon': {
                                      color: theme.palette.primary.main,
                                    },
                                  }}
                                />
                              )}
                              <Chip
                                icon={<PaidIcon />}
                                label={`${currency(job.salaryMin)}${job.salaryMax ? ` – ${currency(job.salaryMax)}` : ''}`}
                                size="small"
                                sx={{
                                  borderRadius: 2,
                                  background: alpha(theme.palette.success.main, 0.1),
                                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                  '& .MuiChip-icon': {
                                    color: theme.palette.success.main,
                                  },
                                }}
                              />
                              <Chip
                                icon={<AccessTimeIcon />}
                                label="Posted 2 days ago"
                                size="small"
                                sx={{
                                  borderRadius: 2,
                                  background: alpha(theme.palette.info.main, 0.1),
                                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                                  '& .MuiChip-icon': {
                                    color: theme.palette.info.main,
                                  },
                                }}
                              />
                            </Stack>

                            {/* Description */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.6,
                              }}
                            >
                              {job.description}
                            </Typography>

                            {/* Action */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme.palette.primary.main,
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                View Details
                                <ArrowForwardIcon
                                  className="job-arrow"
                                  fontSize="small"
                                  sx={{ transition: 'transform 0.3s ease' }}
                                />
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grow>
                ))
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Fade in timeout={800}>
                  <Stack alignItems="center" mt={4}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, p) => {
                        setPage(p);
                        loadJobs(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      shape="rounded"
                      size="large"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: 2,
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.1),
                          },
                          '&.Mui-selected': {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            },
                          },
                        },
                      }}
                    />
                  </Stack>
                </Fade>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Floating Action Button for mobile */}
      <Tooltip title="Filter Jobs">
        <IconButton
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: 'primary.main',
            color: '#fff',
            width: 56,
            height: 56,
            boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
            display: { xs: 'flex', md: 'none' },
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <FilterListIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}