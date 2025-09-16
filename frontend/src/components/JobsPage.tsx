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
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Fab,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
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
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { TransitionProps } from '@mui/material/transitions';
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
  createdAt?: string | null;
  postedAt?: string | null;
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

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted 1 day ago';
  return `Posted ${diffDays} days ago`;
}

// New component for salary filter
const SalaryFilterContent = ({ 
  initialMin, 
  initialMax, 
  onApply 
}: { 
  initialMin: string; 
  initialMax: string; 
  onApply: (min: string, max: string) => void; 
}) => {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(min, max);
  };

  return (
    <Stack 
      component="form"
      spacing={3}
      onSubmit={handleSubmit}
    >
      <TextField
        label="Min salary"
        type="number"
        value={min}
        onChange={(e) => setMin(e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CurrencyRupeeIcon fontSize="small" />
            </InputAdornment>
          ),
          inputProps: { min: 0 },
        }}
      />
      <TextField
        label="Max salary"
        type="number"
        value={max}
        onChange={(e) => setMax(e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CurrencyRupeeIcon fontSize="small" />
            </InputAdornment>
          ),
          inputProps: { min: 0 },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        Apply Salary Range
      </Button>
    </Stack>
  );
};

export default function JobsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Saved jobs set (persisted)
  const [savedJobs, setSavedJobs] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem('savedJobs');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return arr;
        }
      }
    } catch (e) {
      console.warn('Failed to read saved jobs from localStorage', e);
    }
    return [];
  });

  // Check if a job is saved
  const isJobSaved = (id: number) => savedJobs.includes(id);

  // Toggle saved job
  const toggleSaveJob = (jobId: number) => {
    let updated: number[];
    if (savedJobs.includes(jobId)) {
      updated = savedJobs.filter(id => id !== jobId);
    } else {
      updated = [...savedJobs, jobId];
    }
    setSavedJobs(updated);
    
    // Persist to localStorage
    try {
      localStorage.setItem('savedJobs', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist saved jobs to localStorage', e);
    }
  };

  // Mobile filter states
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activeFilterDialog, setActiveFilterDialog] = useState<string>('');
  const [bottomNavValue, setBottomNavValue] = useState(0);

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
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

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
      if (minSalary) params.minSalary = Number(minSalary) || undefined;
      if (maxSalary) params.maxSalary = Number(maxSalary) || undefined;

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

  const currency = (v?: number | null) => (typeof v === 'number' ? `₹${v.toLocaleString()}` : '—');

  const activeFiltersCount = [company, location, role, workMode, minSalary, maxSalary].filter(Boolean).length;

  const JobSkeleton = () => (
    <Card sx={{ 
      mb: 3,
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <CardContent sx={{ p: 3 }}>
        <Skeleton width="60%" height={32} />
        <Skeleton width="30%" sx={{ mt: 1 }} />
        <Stack direction="row" spacing={2} mt={2}>
          <Skeleton width={100} height={32} variant="rounded" />
          <Skeleton width={140} height={32} variant="rounded" />
        </Stack>
        <Skeleton variant="rectangular" height={60} sx={{ mt: 2, borderRadius: 2 }} />
      </CardContent>
    </Card>
  );

  // Mobile Filter Dialogs
  const FilterDialog = ({ type, open, onClose }: { type: string; open: boolean; onClose: () => void }) => {
    const getDialogContent = () => {
      switch (type) {
        case 'company':
          return (
            <FormControl fullWidth>
              <Select
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  onClose();
                }}
                displayEmpty
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
          );
        case 'location':
          return (
            <FormControl fullWidth>
              <Select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  onClose();
                }}
                displayEmpty
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
          );
        case 'role':
          return (
            <FormControl fullWidth>
              <Select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  onClose();
                }}
                displayEmpty
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
          );
        case 'workMode':
          return (
            <Stack spacing={2}>
              {workModes.map((wm) => (
                <Chip
                  key={wm}
                  icon={WORK_MODE_ICONS[wm]}
                  label={WORK_MODE_LABEL[wm] || wm}
                  clickable
                  onClick={() => {
                    setWorkMode(wm);
                    onClose();
                  }}
                  sx={{
  py: 3,
  justifyContent: 'flex-start',
  background: workMode === wm ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
  color: workMode === wm ? '#fff' : 'inherit', // ← Fixed this line
  border: '1px solid',
  borderColor: workMode === wm ? 'transparent' : theme.palette.divider,
}}
                />
              ))}
            </Stack>
          );
        case 'salary':
          return (
            <SalaryFilterContent 
              initialMin={minSalary}
              initialMax={maxSalary}
              onApply={(min, max) => {
                setMinSalary(min);
                setMaxSalary(max);
                onClose();
              }}
            />
          );
        default:
          return null;
      }
    };

    const getDialogTitle = () => {
      const titles: Record<string, string> = {
        company: 'Select Company',
        location: 'Select Location',
        role: 'Select Role',
        workMode: 'Work Mode',
        salary: 'Salary Range',
      };
      return titles[type] || 'Filter';
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={SlideTransition}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            m: 2,
          },
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {getDialogTitle()}
          <IconButton onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {getDialogContent()}
        </DialogContent>
      </Dialog>
    );
  };

  // Desktop Filters Sidebar
  const HorizontalFilters = () => (
    <Paper sx={{
      p: 3,
      borderRadius: 4,
      mb: 3,
      background: 'rgba(255,255,255,0.98)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
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

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Company</InputLabel>
              <Select
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                sx={{ borderRadius: 3 }}
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
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                sx={{ borderRadius: 3 }}
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
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                sx={{ borderRadius: 3 }}
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
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Work mode</InputLabel>
              <Select
                label="Work mode"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                sx={{ borderRadius: 3 }}
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
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Min salary"
              type="number"
              value={minSalary}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^[0-9]*$/.test(value)) {
                  setMinSalary(value);
                }
              }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupeeIcon fontSize="small" />
                  </InputAdornment>
                ),
                inputProps: { min: 0, step: 1 },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Max salary"
              type="number"
              value={maxSalary}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^[0-9]*$/.test(value)) {
                  setMaxSalary(value);
                }
              }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupeeIcon fontSize="small" />
                  </InputAdornment>
                ),
                inputProps: { min: 0, step: 1 },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => loadJobs(1)}
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
              Apply Filters
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              sx={{
                borderRadius: 3,
                py: 1.2,
                borderColor: theme.palette.divider,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              Clear All
            </Button>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
      pb: isMobile ? 10 : 0,
    }}>
      {/* Hero Section with Rounded Corners */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: { xs: 6, md: 10 },
        px: { xs: 2, md: 3 },
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: '50px', md: '100px' },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
        },
      }}>
        <Box sx={{
          position: 'absolute',
          top: { xs: -50, md: -100 },
          right: { xs: -50, md: -100 },
          width: { xs: 200, md: 300 },
          height: { xs: 200, md: 300 },
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          animation: `${float} 6s ease-in-out infinite`,
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: { xs: -30, md: -50 },
          left: { xs: -30, md: -50 },
          width: { xs: 150, md: 200 },
          height: { xs: 150, md: 200 },
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          animation: `${float} 8s ease-in-out infinite`,
        }} />
        
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Stack spacing={3} alignItems="center" position="relative">
              <Typography 
                variant={isMobile ? "h3" : "h2"} 
                sx={{
                  fontWeight: 900,
                  color: '#fff',
                  textAlign: 'center',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                Find Your Dream Job
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: 'center',
                  maxWidth: 600,
                }}
              >
                Discover thousands of opportunities from top companies worldwide
              </Typography>

              <Paper sx={{
                p: { xs: 0.5, md: 1 },
                borderRadius: '50px',
                width: '100%',
                maxWidth: 700,
                backdropFilter: 'blur(20px)',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}>
                <Stack 
                  component="form"
                  direction="row" 
                  spacing={1} 
                  alignItems="center"
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadJobs(1);
                  }}
                >
                  <TextField
                    placeholder={isMobile ? "Search jobs..." : "Search by job title, company, or keywords..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: theme.palette.primary.main, ml: 1 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: '50px',
                        '& fieldset': { border: 'none' },
                        pl: 2,
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        loadJobs(1);
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    type="submit"
                    sx={{
                      borderRadius: '50px',
                      px: { xs: 2, md: 4 },
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(102,126,234,0.6)',
                      },
                      transition: 'all 0.3s ease',
                      minWidth: { xs: 'auto', md: 120 },
                    }}
                  >
                    {isMobile ? <SearchIcon /> : 'Search'}
                  </Button>
                </Stack>
              </Paper>

              {!isMobile && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label="New jobs this week"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      py: 2.5,
                    }}
                  />
                  <Chip
                    label="Remote opportunities available"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      py: 2.5,
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </Fade>
        </Container>
      </Box>
    
       <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        {/* Horizontal Filters for Desktop */}
        {!isMobile && (
          <Fade in timeout={500}>
            <HorizontalFilters />
          </Fade>
        )}

        {/* Job Listings */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Stack spacing={3}>
              {/* Results Header */}
              <Fade in timeout={700}>
                <Paper sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.98)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
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

                    {/* RIGHT SIDE: Saved button with badge */}
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        component={Link}
                        to="/saved-jobs"
                        variant="outlined"
                        startIcon={
                          <Badge badgeContent={savedJobs.length} color="primary">
                            <BookmarkIcon />
                          </Badge>
                        }
                        sx={{
                          borderRadius: 3,
                          borderColor: theme.palette.divider,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      >
                        Saved
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        Page {page} of {totalPages}
                      </Typography>
                    </Stack>
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
                    p: { xs: 4, md: 8 },
                    textAlign: 'center',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                  }}>
                    <Box sx={{
                      width: { xs: 80, md: 120 },
                      height: { xs: 80, md: 120 },
                      margin: '0 auto 2rem',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: `${float} 3s ease-in-out infinite`,
                    }}>
                      <WorkIcon sx={{ fontSize: { xs: 40, md: 60 }, color: '#fff' }} />
                    </Box>
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} gutterBottom>
                      No jobs match your filters
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Try adjusting your search criteria or clearing filters to see more results.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={clearFilters}
                      sx={{
                        borderRadius: 3,
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
                jobs.map((job, index) => {
                  const postedDate = job.createdAt || job.postedAt || null;

                  return (
                    <Grow in timeout={500 + index * 100} key={job.id}>
                      <Card
                        sx={{
                          borderRadius: 4,
                          overflow: 'hidden',
                          position: 'relative',
                          background: 'rgba(255,255,255,0.98)',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                          transition: 'all 0.3s ease',
                          animation: `${fadeIn} 0.5s ease-out`,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                          '&:hover': {
                            transform: { xs: 'none', md: 'translateY(-5px)' },
                            boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
                            borderColor: alpha(theme.palette.primary.main, 0.2),
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
                          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            <Stack spacing={2}>
                              {/* Header with title and save button */}
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box flex={1}>
                                  <Typography
                                    variant={isMobile ? "h6" : "h5"}
                                    fontWeight={800}
                                    gutterBottom
                                    sx={{
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      backgroundClip: 'text',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                    }}
                                  >
                                    {job.title}
                                  </Typography>

                                  <Stack 
                                    direction={{ xs: 'column', sm: 'row' }} 
                                    spacing={{ xs: 1, sm: 3 }} 
                                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                                    flexWrap="wrap"
                                  >
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

                                <Tooltip title={isJobSaved(job.id) ? 'Saved' : 'Save job'}>
                                  <IconButton
                                    aria-label={isJobSaved(job.id) ? 'Unsave job' : 'Save job'}
                                    aria-pressed={isJobSaved(job.id)}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleSaveJob(job.id);
                                    }}
                                    sx={{ color: isJobSaved(job.id) ? "primary.main" : "grey.500" }}
                                  >
                                    {isJobSaved(job.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                                  </IconButton>
                                </Tooltip>
                              </Stack>

                              {/* Tags */}
                              <Stack 
                                direction="row" 
                                spacing={1} 
                                alignItems="center" 
                                flexWrap="wrap"
                                sx={{ gap: 1 }}
                              >
                                {job.workMode && (
                                  <Chip
                                    icon={WORK_MODE_ICONS[job.workMode]}
                                    label={WORK_MODE_LABEL[job.workMode] || job.workMode}
                                    size="small"
                                    sx={{
                                      borderRadius: 3,
                                      background: alpha(theme.palette.primary.main, 0.1),
                                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                      '& .MuiChip-icon': {
                                        color: theme.palette.primary.main,
                                      },
                                    }}
                                  />
                                )}
                                <Chip
                                  icon={<CurrencyRupeeIcon />}
                                  label={`${currency(job.salaryMin)}${job.salaryMax ? ` – ${currency(job.salaryMax)}` : ''}`}
                                  size="small"
                                  sx={{
                                    borderRadius: 3,
                                    background: alpha(theme.palette.success.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                    '& .MuiChip-icon': {
                                      color: theme.palette.success.main,
                                    },
                                  }}
                                />
                                <Chip
                                  icon={<AccessTimeIcon />}
                                  label={postedDate ? timeAgo(postedDate) : '—'}
                                  size="small"
                                  sx={{
                                    borderRadius: 3,
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
                                  WebkitLineClamp: { xs: 2, md: 3 },
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
                  );
                })
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
                      size={isMobile ? "medium" : "large"}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: 3,
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderRadius: '20px 20px 0 0',
            overflow: 'hidden',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
        >
          <BottomNavigation
            value={bottomNavValue}
            onChange={(event, newValue) => {
              setBottomNavValue(newValue);
            }}
            sx={{
              height: 70,
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)',
              '& .MuiBottomNavigationAction-root': {
                minWidth: 50,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              },
            }}
          >
            <BottomNavigationAction
              label="Company"
              icon={
                <Badge 
                  variant="dot" 
                  color="primary" 
                  invisible={!company}
                >
                  <BusinessIcon />
                </Badge>
              }
              onClick={() => setActiveFilterDialog('company')}
            />
            <BottomNavigationAction
              label="Location"
              icon={
                <Badge 
                  variant="dot" 
                  color="primary" 
                  invisible={!location}
                >
                  <LocationOnIcon />
                </Badge>
              }
              onClick={() => setActiveFilterDialog('location')}
            />
            <BottomNavigationAction
              label="Role"
              icon={
                <Badge 
                  variant="dot" 
                  color="primary" 
                  invisible={!role}
                >
                  <WorkIcon />
                </Badge>
              }
              onClick={() => setActiveFilterDialog('role')}
            />
            <BottomNavigationAction
              label="Mode"
              icon={
                <Badge 
                  variant="dot" 
                  color="primary" 
                  invisible={!workMode}
                >
                  <CategoryIcon />
                </Badge>
              }
              onClick={() => setActiveFilterDialog('workMode')}
            />
            <BottomNavigationAction
              label="Salary"
              icon={
                <Badge 
                  variant="dot" 
                  color="primary" 
                  invisible={!minSalary && !maxSalary}
                >
                  <CurrencyRupeeIcon />
                </Badge>
              }
              onClick={() => setActiveFilterDialog('salary')}
            />
          </BottomNavigation>

          {activeFiltersCount > 0 && (
            <Box sx={{
              position: 'absolute',
              top: -40,
              right: 16,
            }}>
              <Fab
                size="small"
                color="secondary"
                onClick={clearFilters}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  animation: `${pulse} 2s ease-in-out infinite`,
                }}
              >
                <ClearIcon />
              </Fab>
            </Box>
          )}
        </Paper>
      )}

      {/* Mobile Filter Dialogs */}
      {['company', 'location', 'role', 'workMode', 'salary'].map((filterType) => (
        <FilterDialog
          key={filterType}
          type={filterType}
          open={activeFilterDialog === filterType}
          onClose={() => setActiveFilterDialog('')}
        />
      ))}
    </Box>
  );
}