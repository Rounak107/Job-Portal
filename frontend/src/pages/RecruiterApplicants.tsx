import { useEffect, useMemo, useState } from 'react';
import { api } from '../api'; 
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Stack,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Fade,
  Slide,
  Grow,
  Paper,
  Tooltip,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Person,
  Work,
  Email,
  CalendarToday,
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
  Search,
} from '@mui/icons-material';

const API_BASE = import.meta.env.VITE_API_BASE;

type Status = 'PENDING' | 'REJECTED' | 'REVIEWED' | 'ACCEPTED';

type ApplicantRow = {
  id: number;
  status: Status;
  appliedAt: string;
  resumeUrl?: string | null;
  user: { id: number; name: string; email: string } | null;
  job: { id: number; title: string } | null;
};

function getToken() {
  try {
    return localStorage.getItem('jobportal_token') || '';
  } catch {
    return '';
  }
}

const STATUS_LABEL: Record<Status, string> = {
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  REVIEWED: 'Reviewed',
  ACCEPTED: 'Accepted',
};

// Options WITHOUT "Reviewed"
const STATUS_OPTIONS: { value: Exclude<Status, 'REVIEWED'>; label: string }[] = [
  { value: 'PENDING', label: STATUS_LABEL.PENDING },
  { value: 'ACCEPTED', label: STATUS_LABEL.ACCEPTED },
  { value: 'REJECTED', label: STATUS_LABEL.REJECTED },
];

// Normalize incoming API status to our enum
function normalizeStatus(s: any): Status {
  const key = String(s ?? '').trim().toUpperCase().replace(/[\s_-]/g, '');
  const map: Record<string, Status> = {
    PENDING: 'PENDING',
    PENDINGREVIEW: 'PENDING',
    UNDERREVIEW: 'REVIEWED',
    INREVIEW: 'REVIEWED',
    REVIEWED: 'REVIEWED',
    ACCEPTED: 'ACCEPTED',
    APPROVED: 'ACCEPTED',
    REJECTED: 'REJECTED',
  };
  return map[key] || 'PENDING';
}

const statusConfig: Record<
  Status,
  { color: string; bgColor: string; icon: typeof Schedule; label: string }
> = {
  PENDING: {
    color: '#FF9800',
    bgColor: '#FFF3E0',
    icon: Schedule,
    label: 'Pending Review',
  },
  REJECTED: {
    color: '#F44336',
    bgColor: '#FFEBEE',
    icon: Cancel,
    label: 'Rejected',
  },
  REVIEWED: {
    color: '#2196F3',
    bgColor: '#E3F2FD',
    icon: Visibility,
    label: 'Under Review',
  },
  ACCEPTED: {
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    icon: CheckCircle,
    label: 'Accepted',
  },
};

export default function RecruiterApplicants() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [editStatus, setEditStatus] = useState<Record<number, Status>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${getToken()}`,
    }),
    []
  );

  // Calculate stats (based on normalized statuses)
  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === 'PENDING').length;
    const accepted = rows.filter((r) => r.status === 'ACCEPTED').length;
    const rejected = rows.filter((r) => r.status === 'REJECTED').length;
    const reviewed = rows.filter((r) => r.status === 'REVIEWED').length;

    return { total, pending, accepted, rejected, reviewed };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = r.user?.name?.toLowerCase() || '';
      const email = r.user?.email?.toLowerCase() || '';
      const title = r.job?.title?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || title.includes(q);
    });
  }, [rows, searchQuery]);

  useEffect(() => {
  (async () => {
    try {
      setLoading(true);

      // ✅ Axios call instead of fetch + headers
      const { data } = await api.get('/applications/recruiter/applicants');

      // ✅ Data transformation stays the same
      const list = Array.isArray(data.applicants)
        ? data.applicants
        : Array.isArray(data.items)
        ? data.items
        : [];

      const applicants: ApplicantRow[] = list.map((a: any) => ({
        id: Number(a.id),
        status: normalizeStatus(a.status),
        appliedAt: a.appliedAt || a.createdAt || '',
        resumeUrl: a.resumeUrl ?? null,
        user: a.user ?? null,
        job: a.job ?? null,
      }));

      setRows(applicants);

      const init: Record<number, Status> = {};
      applicants.forEach((r) => {
        init[r.id] = r.status;
      });
      setEditStatus(init);

    } catch (e: any) {
      console.error(e);
      setToast({
        open: true,
        message: e?.message || 'Failed to load applicants',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  })();
}, []);   // 👈 no need for authHeaders dependency anymore

  async function confirmUpdate(appId: number) {
  try {
    const next = editStatus[appId] || 'PENDING';
    setSaving((s) => ({ ...s, [appId]: true }));

    // ✅ Use axios.patch instead of fetch
    await api.patch(`/applications/applications/${appId}/status`, { status: next });

    // ✅ Update UI state
    setRows((prev) =>
      prev.map((r) => (r.id === appId ? { ...r, status: next } : r))
    );

    setToast({
      open: true,
      message: 'Status updated and email sent.',
      severity: 'success',
    });
  } catch (e: any) {
    console.error(e);
    setToast({
      open: true,
      message: e?.message || 'Failed to update status',
      severity: 'error',
    });
  } finally {
    setSaving((s) => ({ ...s, [appId]: false }));
  }
}

  if (loading) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Fade in={loading}>
          <Paper
            elevation={24}
            sx={{
              p: 6,
              borderRadius: 4,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 3, fontWeight: 600 }}>
              Loading Applicants...
            </Typography>
          </Paper>
        </Fade>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
        {/* Header Section */}
        <Slide direction="down" in timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <Person fontSize="large" />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Applicant Management
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>
                  Review and manage job applications efficiently
                </Typography>
              </Box>
            </Stack>

            {/* Stats Cards */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              {[
                { label: 'Total Applications', value: stats.total, color: '#667eea', icon: TrendingUp },
                { label: 'Pending Review', value: stats.pending, color: '#FF9800', icon: Schedule },
                { label: 'Accepted', value: stats.accepted, color: '#4CAF50', icon: CheckCircle },
                { label: 'Rejected', value: stats.rejected, color: '#F44336', icon: Cancel },
              ].map((stat, index) => (
                <Grow key={stat.label} in timeout={1000 + index * 200}>
                  <Card
                    elevation={8}
                    sx={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                      border: `2px solid ${alpha(stat.color, 0.1)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[16],
                        borderColor: alpha(stat.color, 0.3),
                      },
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(stat.color, 0.1),
                            color: stat.color,
                            width: 48,
                            height: 48,
                          }}
                        >
                          <stat.icon />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={800} color={stat.color}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grow>
              ))}
            </Stack>
          </Box>
        </Slide>

        {/* Main Table */}
        <Slide direction="up" in timeout={1000}>
          <Card
            elevation={16}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box
                sx={{
                  p: 3,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Typography variant="h6" fontWeight={700} color="white">
                    All Applicants ({visibleRows.length})
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {searchOpen && (
                      <TextField
                        size="small"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, position"
                        sx={{
                          minWidth: { xs: 180, sm: 260 },
                          bgcolor: 'white',
                          borderRadius: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                    <Tooltip title={searchOpen ? 'Close search' : 'Search'}>
                      <IconButton
                        onClick={() => {
                          if (searchOpen) setSearchQuery('');
                          setSearchOpen((s) => !s);
                        }}
                        sx={{ color: 'white' }}
                      >
                        <Search />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>

              {/* TableContainer to prevent clipping and allow horizontal scroll */}
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 1000 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Candidate</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Position</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Applied Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Profile</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.map((r, index) => {
                      const cfg = statusConfig[r.status] || statusConfig.PENDING;
                      const StatusIcon = cfg.icon;

                      const d = r.appliedAt ? new Date(r.appliedAt) : null;
                      const appliedStr =
                        d && !isNaN(d.getTime())
                          ? d.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—';

                      const currentStatus: Status = editStatus[r.id] ?? r.status ?? 'PENDING';

                      return (
                        <Fade key={r.id} in timeout={1200 + index * 100}>
                          <TableRow
                            hover
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                transform: 'scale(1.01)',
                              },
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar
                                  sx={{
                                    bgcolor: 'primary.main',
                                    width: 40,
                                    height: 40,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {r.user?.name?.charAt(0) || '?'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" fontWeight={600}>
                                    {r.user?.name || '—'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {r.id}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" fontWeight={500}>
                                  {r.user?.email || '—'}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Work sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" fontWeight={500}>
                                  {r.job?.title || '—'}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">{appliedStr}</Typography>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Chip
                                icon={<StatusIcon sx={{ fontSize: 16 }} />}
                                label={cfg.label}
                                sx={{
                                  bgcolor: cfg.bgColor,
                                  color: cfg.color,
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 28,
                                  '& .MuiChip-icon': { color: cfg.color },
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              {r.user?.id ? (
                                <Button
                                  component={Link}
                                  to={`/profile/${r.user.id}`}
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Visibility />}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                    },
                                  }}
                                >
                                  View
                                </Button>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  —
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent="flex-end"
                                sx={{ flexWrap: 'wrap', rowGap: 1 }}
                              >
                                <Select
                                  size="small"
                                  value={currentStatus}
                                  onChange={(e) =>
                                    setEditStatus((s) => ({
                                      ...s,
                                      [r.id]: (e.target.value as Status) || 'PENDING',
                                    }))
                                  }
                                  sx={{
                                    minWidth: 140,
                                    borderRadius: 2,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: alpha(theme.palette.primary.main, 0.2),
                                    },
                                  }}
                                >
                                  {/* Hidden Reviewed option to avoid MUI warning if current is REVIEWED */}
                                  {currentStatus === 'REVIEWED' && (
                                    <MenuItem value="REVIEWED" sx={{ display: 'none' }}>
                                      {STATUS_LABEL.REVIEWED}
                                    </MenuItem>
                                  )}
                                  {STATUS_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </MenuItem>
                                  ))}
                                </Select>

                                <Button
                                  variant="contained"
                                  onClick={() => confirmUpdate(r.id)}
                                  disabled={saving[r.id] === true}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    minWidth: { xs: 96, sm: 100 },
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                      transform: 'scale(1.05)',
                                    },
                                    '&:disabled': {
                                      background: alpha(theme.palette.action.disabled, 0.12),
                                    },
                                  }}
                                >
                                  {saving[r.id] ? 'Updating…' : 'Update'}
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        </Fade>
                      );
                    })}

                    {visibleRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <Box>
                            <Avatar
                              sx={{
                                bgcolor: 'grey.100',
                                width: 80,
                                height: 80,
                                mx: 'auto',
                                mb: 2,
                              }}
                            >
                              <Person sx={{ fontSize: 40, color: 'grey.400' }} />
                            </Avatar>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No applicants found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Try a different search term or clear the search
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Slide>
      </Box>

      {/* Enhanced Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Slide}
      >
        <Alert
          onClose={() => setToast((s) => ({ ...s, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: 2,
            fontWeight: 600,
            '& .MuiAlert-icon': {
              fontSize: 24,
            },
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}