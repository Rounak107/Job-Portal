
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Button,
  Stack,
  Avatar,
  Snackbar,
  Alert,
  Chip,
  Divider,
  IconButton,
  Container,
  Fade,
  Slide,
  Zoom,
  CircularProgress,
  Skeleton,
  InputAdornment,
  Tooltip,
  Badge,
  LinearProgress,
  alpha,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Description as BioIcon,
  Psychology as SkillsIcon,
  PhotoCamera as CameraIcon,
  Visibility as ViewIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  EmojiEvents as AchievementIcon,
  AccountCircle as ProfileIcon,
  Upload as UploadIcon,
  AddCircleOutline as AddIcon,
  DeleteOutline as DeleteIcon,
  Business as BusinessIcon,
  Title as TitleIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { api } from '../api';
import { adminApi } from '../utils/adminApi';

// New Animations
const floatElevate = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const fadeInGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const slideInFromRight = keyframes`
  0% { opacity: 0; transform: translateX(30px); }
  100% { opacity: 1; transform: translateX(0); }
`;

const pulseSoft = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmerWave = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const progressBar = keyframes`
  0% { width: 0%; }
  100% { width: 100%; }
`;

// Styled Components with new design
const ProfileContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(6),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '380px',
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
    zIndex: -1,
    borderBottomLeftRadius: '40px',
    borderBottomRightRadius: '40px',
  }
}));

const GlassCard = styled(Card)(({ theme }) => ({
  background: `rgba(255, 255, 255, 0.85)`,
  backdropFilter: 'blur(12px)',
  borderRadius: theme.spacing(3),
  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(5, 4),
  marginBottom: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  animation: `${fadeInGradient} 8s ease infinite`,
  backgroundSize: '200% 200%',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  backdropFilter: 'blur(10px)',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 140,
  height: 140,
  fontSize: 52,
  border: `4px solid ${alpha(theme.palette.common.white, 0.9)}`,
  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.4s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.08)',
    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const UploadButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: 8,
  right: 8,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    animation: `${pulseSoft} 1.5s infinite`,
  },
  transition: 'all 0.3s ease',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  color: theme.palette.text.primary,
  position: 'relative',
  paddingBottom: theme.spacing(1),
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40px',
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '2px',
  },
  '& svg': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '50%',
    padding: theme.spacing(0.75),
    color: theme.palette.common.white,
    fontSize: '28px',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(2),
    transition: 'all 0.3s ease',
    backgroundColor: alpha(theme.palette.common.white, 0.8),
    '&:hover': {
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    '&.Mui-focused': {
      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: '2px',
        borderColor: theme.palette.primary.main,
      }
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  '& .Mui-disabled': {
    backgroundColor: alpha(theme.palette.grey[50], 0.5),
  }
}));

const SaveButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.75, 5),
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 600,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 10px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    background: theme.palette.grey[300],
    boxShadow: 'none',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.2)}, transparent)`,
    animation: `${shimmerWave} 2s infinite linear`,
  }
}));

const SkillChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  borderRadius: theme.spacing(3),
  fontWeight: 500,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  color: theme.palette.primary.dark,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
  },
  '& .MuiChip-icon': {
    color: theme.palette.primary.main,
  }
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '50vh',
  gap: theme.spacing(3),
}));

const AnimatedSection = styled(Box)({
  animation: `${slideInFromRight} 0.6s ease-out`,
});

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
  '& .MuiLinearProgress-bar': {
    borderRadius: 3,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    animation: `${progressBar} 1.5s ease-in-out infinite`,
  },
}));

// Types
type Profile = {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'RECRUITER' | 'ADMIN';
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  skills?: string | null;
  experience?: string | null;
  education?: string | null;
  profilePic?: string | null;
  resumeUrl?: string | null;
};

type EduState = {
  tenth: string;
  twelfth: string;
  graduation: string;
  postGraduation: string;
};

type ExperienceItem = {
  company: string;
  designation: string;
  details: string;
  startMonth: string; // YYYY-MM
  endMonth?: string;  // YYYY-MM
  current?: boolean;
};

const initialEdu: EduState = { tenth: '', twelfth: '', graduation: '', postGraduation: '' };
const API_BASE = import.meta.env.VITE_API_BASE;

function assetUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('/uploads/')) {
    // strip /api from API_BASE
    const base = import.meta.env.VITE_API_BASE?.replace(/\/api$/, '') || '';
    return `${base}${path}`;
  }
  return path;
}

// Helpers: Experience parsing and total years
function ymToIndex(ym?: string): number | null {
  if (!ym) return null;
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  return year * 12 + month;
}

function computeTotalExperienceYears(list: ExperienceItem[]): number {
  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();

  const ranges: Array<{ s: number; e: number }> = [];
  for (const it of list) {
    const s = ymToIndex(it.startMonth);
    const e = it.current ? nowIdx : ymToIndex(it.endMonth || it.startMonth);
    if (s == null || e == null || e < s) continue;
    ranges.push({ s, e });
  }
  if (!ranges.length) return 0;

  ranges.sort((a, b) => a.s - b.s);
  const merged: Array<{ s: number; e: number }> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last) merged.push({ ...r });
    else if (r.s <= last.e + 1) last.e = Math.max(last.e, r.e);
    else merged.push({ ...r });
  }
  const totalMonths = merged.reduce((sum, r) => sum + (r.e - r.s + 1), 0);
  const years = totalMonths / 12;
  const rounded = Math.round(years * 10) / 10;
  return rounded < 0.1 ? 0 : rounded;
}

function parseExperience(raw: string | null | undefined): ExperienceItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => ({
          company: String(x.company ?? ''),
          designation: String(x.designation ?? ''),
          details: String(x.details ?? ''),
          startMonth: String(x.startMonth ?? ''),
          endMonth: x.endMonth ? String(x.endMonth) : undefined,
          current: Boolean(x.current),
        }))
        .filter((x) => x.company || x.designation || x.details || x.startMonth || x.endMonth);
    }
  } catch {
    // not JSON, fall through
  }
  // Fallback: put the raw text as details in a single item to encourage proper entry
  return [{
    company: '',
    designation: '',
    details: raw || '',
    startMonth: '',
    endMonth: '',
    current: false,
  }];
}

// New helpers for DatePicker integration and detailed total
function ymToDate(ym?: string): Date | null {
  const idx = ymToIndex(ym);
  if (idx == null) return null;
  const year = Math.floor(idx / 12);
  const month = idx % 12; // 0-11
  return new Date(year, month, 1);
}

function dateToYm(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function computeTotalExperienceParts(list: ExperienceItem[]) {
  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();

  const ranges: Array<{ s: number; e: number }> = [];
  for (const it of list) {
    const s = ymToIndex(it.startMonth);
    const e = it.current ? nowIdx : ymToIndex(it.endMonth || it.startMonth);
    if (s == null || e == null || e < s) continue;
    ranges.push({ s, e });
  }
  if (!ranges.length) return { years: 0, months: 0, totalMonths: 0 };

  ranges.sort((a, b) => a.s - b.s);
  const merged: Array<{ s: number; e: number }> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last) merged.push({ ...r });
    else if (r.s <= last.e + 1) last.e = Math.max(last.e, r.e);
    else merged.push({ ...r });
  }
  const totalMonths = merged.reduce((sum, r) => sum + (r.e - r.s + 1), 0);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return { years, months, totalMonths };
}

const ProfileSkeleton = () => (
  <ProfileContainer maxWidth="lg">
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="rounded" width="100%" height={200} sx={{ borderRadius: 3 }} />
    </Box>
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rounded" width="100%" height={400} sx={{ borderRadius: 3 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rounded" width="100%" height={400} sx={{ borderRadius: 3 }} />
      </Grid>
    </Grid>
  </ProfileContainer>
);

export default function ProfilePage() {
  const { userId } = useParams();
  const viewUserId = userId ? parseInt(userId, 10) : null;
  const isViewingOther = !!viewUserId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [edu, setEdu] = useState<EduState>(initialEdu);
  const [errors, setErrors] = useState<{ tenth?: boolean; twelfth?: boolean; graduation?: boolean }>({});
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success'|'error'}>({
    open: false, message: '', severity: 'success'
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // New: Experience list state and validation errors
  const [expList, setExpList] = useState<ExperienceItem[]>([]);
  const [expErrors, setExpErrors] = useState<Array<{
    company?: boolean;
    designation?: boolean;
    details?: boolean;
    startMonth?: boolean;
    endMonth?: boolean;
  }>>([]);

  const endpoint = useMemo(
    () => (isViewingOther ? `/users/${viewUserId}/profile` : `/users/me/profile`),
    [isViewingOther, viewUserId]
  );

  // Load profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await adminApi.get(endpoint);
        const prof: Profile | null = res.data?.profile ?? null;

        let parsedEdu: EduState = initialEdu;
        if (prof?.education) {
          try {
            const parsed = JSON.parse(prof.education);
            parsedEdu = {
              tenth: parsed?.tenth ?? '',
              twelfth: parsed?.twelfth ?? '',
              graduation: parsed?.graduation ?? '',
              postGraduation: parsed?.postGraduation ?? '',
            };
          } catch {
            parsedEdu = { ...initialEdu, graduation: prof.education || '' };
          }
        }

        const expParsed = parseExperience(prof?.experience);
        if (!cancelled) {
          setProfile(prof);
          setEdu(parsedEdu);
          setExpList(expParsed.length ? expParsed : (isViewingOther ? [] : [{
            company: '',
            designation: '',
            details: '',
            startMonth: '',
            endMonth: '',
            current: false
          }]));
          setExpErrors(expParsed.map(() => ({})));
        }
      } catch (e: any) {
        if (!cancelled) {
          setProfile(null);
          setToast({
            open: true,
            message: e?.response?.data?.message || e?.message || 'Failed to load profile',
            severity: 'error'
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [endpoint, isViewingOther]);

  // Save profile
  async function saveProfile() {
    if (isViewingOther || !profile) return;

    // Validate Education
    const newErrors = {
      tenth: !edu.tenth?.trim(),
      twelfth: !edu.twelfth?.trim(),
      graduation: !edu.graduation?.trim(),
    };
    setErrors(newErrors);
    if (newErrors.tenth || newErrors.twelfth || newErrors.graduation) {
      setToast({ open: true, message: 'Please fill 10th, 12th and Graduation.', severity: 'error' });
      return;
    }

    // Validate Experience (compulsory)
    const [expValid, expErrArray] = validateExperience(expList);
    setExpErrors(expErrArray);
    if (!expValid) {
      setToast({ open: true, message: 'Please complete all required Experience fields.', severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      const educationJSON = JSON.stringify({
        tenth: edu.tenth.trim(),
        twelfth: edu.twelfth.trim(),
        graduation: edu.graduation.trim(),
        postGraduation: edu.postGraduation.trim(),
      });
      const experienceJSON = JSON.stringify(expList);

      const res = await api.patch(`/users/me/profile`, {
        name: profile.name,
        bio: profile.bio || '',
        phone: profile.phone || '',
        location: profile.location || '',
        skills: profile.skills || '',
        experience: experienceJSON,
        education: educationJSON,
      });

      const updated = res.data?.profile ?? { ...profile, experience: experienceJSON, education: educationJSON };
      setProfile(updated);
      setToast({ open: true, message: 'Profile saved successfully!', severity: 'success' });
    } catch (e: any) {
      setToast({ open: true, message: e?.response?.data?.message || e?.message || 'Failed to save profile', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // Upload image
  async function uploadImage(file: File) {
    try {
      if (!file.type.startsWith('image/')) {
        setToast({ open: true, message: 'Please select an image file.', severity: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ open: true, message: 'Image must be ≤ 5MB.', severity: 'error' });
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const fd = new FormData();
      fd.append('file', file);

      const res = await api.patch(`/users/me/profile/avatar`, fd, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      setProfile((p) => (p ? { ...p, profilePic: res.data?.profilePic ?? p.profilePic } : p));
      setToast({ open: true, message: 'Profile picture updated!', severity: 'success' });
    } catch (e: any) {
      setToast({ open: true, message: e?.response?.data?.message || e?.message || 'Upload failed', severity: 'error' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ProfileContainer maxWidth="lg">
          <Box className="flex items-center justify-center h-64">
            <Typography variant="h5" color="text.secondary">Profile not found</Typography>
          </Box>
        </ProfileContainer>
      </LocalizationProvider>
    );
  }

  const readonly = isViewingOther;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'RECRUITER': return 'primary';
      default: return 'success';
    }
  };

  // const totalExpYears = computeTotalExperienceYears(expList);
  const expAgg = computeTotalExperienceParts(expList);

  // Experience handlers
  function updateExp(index: number, patch: Partial<ExperienceItem>) {
    setExpList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      // If current is true, clear endMonth
      if (patch.current) {
        next[index].endMonth = '';
      }
      return next;
    });
    setExpErrors(prev => {
      const next = [...prev];
      if (!next[index]) next[index] = {};
      // Clear errors on change for touched fields
      Object.keys(patch).forEach((k) => {
        if (k in next[index]) (next[index] as any)[k] = false;
      });
      return next;
    });
  }

  function addExperience() {
    setExpList(prev => [
      ...prev,
      { company: '', designation: '', details: '', startMonth: '', endMonth: '', current: false }
    ]);
    setExpErrors(prev => [...prev, {}]);
  }

  function removeExperience(idx: number) {
    setExpList(prev => prev.filter((_, i) => i !== idx));
    setExpErrors(prev => prev.filter((_, i) => i !== idx));
  }

  function validateExperience(list: ExperienceItem[]): [boolean, Array<any>] {
    const errs = list.map((it) => ({
      company: !it.company.trim(),
      designation: !it.designation.trim(),
      details: !it.details.trim(),
      startMonth: !it.startMonth,
      endMonth: !(it.current || !!it.endMonth),
    }));
    const valid = list.length > 0 && errs.every(e => !e.company && !e.designation && !e.details && !e.startMonth && !e.endMonth);
    return [valid, errs];
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ProfileContainer maxWidth="lg">
        {/* Header Section */}
        <Fade in timeout={800}>
          <ProfileHeader>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={4} 
              alignItems={{ xs: 'center', md: 'flex-start' }}
            >
              <Box position="relative" sx={{ animation: `${floatElevate} 4s ease-in-out infinite` }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    !readonly && (
                      <Tooltip title="Change Profile Picture" arrow>
                        <UploadButton component="label" size="small">
                          <CameraIcon fontSize="small" />
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadImage(f);
                            }}
                          />
                        </UploadButton>
                      </Tooltip>
                    )
                  }
                >
                  <StyledAvatar
                    src={assetUrl(profile.profilePic)}
                    alt={profile.name}
                  >
                    {profile.name?.[0]?.toUpperCase()}
                  </StyledAvatar>
                </Badge>
                {isUploading && (
                  <CircularProgress
                    variant="determinate"
                    value={uploadProgress}
                    size={150}
                    thickness={2}
                    sx={{
                      position: 'absolute',
                      top: -5,
                      left: -5,
                      color: 'primary.main',
                    }}
                  />
                )}
              </Box>

              <Box flex={1} textAlign={{ xs: 'center', md: 'left' }} sx={{ pt: { md: 2 } }}>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{ 
                  background: 'linear-gradient(135deg, #1976d2, #7b1fa2)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {profile.name}
                </Typography>
                
                {/* Mobile-friendly chip alignment */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.25, sm: 2 }}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  justifyContent={{ xs: 'flex-start', md: 'flex-start' }}
                  flexWrap={{ xs: 'nowrap', sm: 'wrap' }}
                  width="100%"
                  maxWidth={720}
                  mx={{ xs: 'auto', md: 0 }}
                  mb={3}
                >
                  <Chip
                    icon={<EmailIcon />}
                    label={profile.email}
                    variant="outlined"
                    sx={{ 
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: 'flex-start',
                      px: 1.25,
                      py: 0.75,
                      animation: `${slideInFromRight} 0.8s ease-out`,
                      background: alpha('#1976d2', 0.08),
                      color: 'primary.dark',
                    }}
                  />
                  <Chip
                    icon={<ProfileIcon />}
                    label={profile.role}
                    color={getRoleBadgeColor(profile.role)}
                    sx={{ 
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: 'flex-start',
                      px: 1.25,
                      py: 0.75,
                      animation: `${slideInFromRight} 1s ease-out`,
                    }}
                  />
                  {profile.location && (
                    <Chip
                      icon={<LocationIcon />}
                      label={profile.location}
                      variant="outlined"
                      sx={{ 
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: 'flex-start',
                        px: 1.25,
                        py: 0.75,
                        animation: `${slideInFromRight} 1.2s ease-out`,
                        background: alpha('#1976d2', 0.08),
                        color: 'primary.dark',
                      }}
                    />
                  )}
                </Stack>

                {profile.bio && (
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      maxWidth: 600,
                      animation: `${slideInFromRight} 1.4s ease-out`,
                      lineHeight: 1.7,
                      fontSize: '1.1rem',
                    }}
                  >
                    {profile.bio}
                  </Typography>
                )}

                {profile.resumeUrl && (
                  <Zoom in timeout={1000}>
                    <Button
                      variant="outlined"
                      size="medium"
                      href={assetUrl(profile.resumeUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<ViewIcon />}
                      sx={{ 
                        mt: 3,
                        borderRadius: 3,
                        animation: `${floatElevate} 3s ease-in-out infinite`,
                      }}
                    >
                      View Resume
                    </Button>
                  </Zoom>
                )}
              </Box>
            </Stack>
          </ProfileHeader>
        </Fade>

        {/* Personal Information */}
        <AnimatedSection sx={{ mb: 4 }}>
          <GlassCard>
            <CardContent sx={{ p: 5 }}>
              <SectionTitle variant="h5" gutterBottom>
                <PersonIcon /> Personal Information
              </SectionTitle>
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    label="Full Name"
                    fullWidth
                    value={profile.name || ''}
                    onChange={(e) => !readonly && setProfile(p => p ? ({ ...p, name: e.target.value }) : p)}
                    disabled={readonly}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <StyledTextField 
                    label="Email" 
                    fullWidth 
                    value={profile.email || ''} 
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <StyledTextField
                    label="Phone"
                    fullWidth
                    value={profile.phone || ''}
                    onChange={(e) => !readonly && setProfile(p => p ? ({ ...p, phone: e.target.value }) : p)}
                    disabled={readonly}
                    placeholder="+1 (555) 123-4567"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <StyledTextField
                    label="Location"
                    fullWidth
                    value={profile.location || ''}
                    onChange={(e) => !readonly && setProfile(p => p ? ({ ...p, location: e.target.value }) : p)}
                    disabled={readonly}
                    placeholder="City, Country"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <StyledTextField
                    label="Bio"
                    fullWidth
                    multiline
                    minRows={3}
                    value={profile.bio || ''}
                    onChange={(e) => !readonly && setProfile(p => p ? ({ ...p, bio: e.target.value }) : p)}
                    disabled={readonly}
                    placeholder="Tell us about yourself..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                          <BioIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </AnimatedSection>

        {/* Skills & Experience */}
        <AnimatedSection sx={{ mb: 4 }}>
          <GlassCard>
            <CardContent sx={{ p: 5 }}>
              <SectionTitle variant="h5" gutterBottom>
                <SkillsIcon /> Skills & Experience
              </SectionTitle>
              
              <Grid container spacing={4}>
                {/* Skills */}
                <Grid item xs={12}>
                  <StyledTextField
                    label="Skills"
                    fullWidth
                    value={profile.skills || ''}
                    onChange={(e) => !readonly && setProfile(p => p ? ({ ...p, skills: e.target.value }) : p)}
                    disabled={readonly}
                    placeholder="React, Node.js, TypeScript (comma separated)"
                    helperText="Separate skills with commas"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SkillsIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  {skillsArray.length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skillsArray.map((skill, index) => (
                        <Zoom in timeout={400 * (index + 1)} key={`${skill}-${index}`}>
                          <SkillChip 
                            label={skill} 
                            color="primary" 
                            variant="outlined"
                            icon={<CheckIcon />}
                          />
                        </Zoom>
                      ))}
                    </Box>
                  )}
                </Grid>

                {/* Experience - Dynamic, Required */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon color="primary" /> Experience
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={`Total: ${expAgg.years}y${expAgg.months ? ` ${expAgg.months}m` : ''}`}
                        color="primary"
                        variant="outlined"
                      />
                      {!readonly && (
                        <Button startIcon={<AddIcon />} onClick={addExperience} variant="outlined">
                          Add Experience
                        </Button>
                      )}
                    </Stack>
                  </Box>

                  <Stack spacing={3}>
                    {expList.length === 0 && readonly && (
                      <Typography variant="body2" color="text.secondary">
                        No experience details available.
                      </Typography>
                    )}

                    {expList.map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          border: `1px solid ${alpha('#1976d2', 0.15)}`,
                          borderRadius: 2,
                          p: 2.5,
                          backgroundColor: alpha('#ffffff', 0.9)
                        }}
                      >
                        <Grid container spacing={2}>
                          {/* Company */}
                          <Grid item xs={12} md={6}>
                            <StyledTextField
                              label="Company Name"
                              fullWidth
                              required
                              value={item.company}
                              error={!!expErrors[idx]?.company}
                              helperText={expErrors[idx]?.company ? 'Company name is required' : ''}
                              onChange={(e) => !readonly && updateExp(idx, { company: e.target.value })}
                              disabled={readonly}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <BusinessIcon color={expErrors[idx]?.company ? 'error' : 'primary'} />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          {/* Designation */}
                          <Grid item xs={12} md={6}>
                            <StyledTextField
                              label="Designation"
                              fullWidth
                              required
                              value={item.designation}
                              error={!!expErrors[idx]?.designation}
                              helperText={expErrors[idx]?.designation ? 'Designation is required' : ''}
                              onChange={(e) => !readonly && updateExp(idx, { designation: e.target.value })}
                              disabled={readonly}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <TitleIcon color={expErrors[idx]?.designation ? 'error' : 'primary'} />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          {/* Start Month - DatePicker */}
                          <Grid item xs={12} md={4}>
                            <DatePicker
                              label="Start Month"
                              views={['year', 'month']}
                              openTo="month"
                              value={ymToDate(item.startMonth)}
                              onChange={(d) => !readonly && updateExp(idx, { startMonth: dateToYm(d) })}
                              disabled={readonly}
                              renderInput={(params) => (
                                <StyledTextField
                                  {...params}
                                  fullWidth
                                  required
                                  error={!!expErrors[idx]?.startMonth}
                                  helperText={expErrors[idx]?.startMonth ? 'Start month is required' : ''}
                                  InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <CalendarIcon color={expErrors[idx]?.startMonth ? 'error' : 'primary'} />
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </Grid>
                          {/* End Month - DatePicker */}
                          <Grid item xs={12} md={4}>
                            <DatePicker
                              label="End Month"
                              views={['year', 'month']}
                              openTo="month"
                              value={ymToDate(item.endMonth || '')}
                              onChange={(d) => !readonly && updateExp(idx, { endMonth: dateToYm(d) })}
                              disabled={readonly || !!item.current}
                              minDate={ymToDate(item.startMonth) || undefined}
                              disableFuture={!item.current}
                              renderInput={(params) => (
                                <StyledTextField
                                  {...params}
                                  fullWidth
                                  required={!item.current}
                                  error={!!expErrors[idx]?.endMonth}
                                  helperText={
                                    item.current
                                      ? 'Currently working'
                                      : expErrors[idx]?.endMonth
                                      ? 'End month is required'
                                      : ''
                                  }
                                  InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <CalendarIcon color={expErrors[idx]?.endMonth ? 'error' : 'primary'} />
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </Grid>
                          {/* Current switch */}
                          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={!!item.current}
                                  onChange={(e) => !readonly && updateExp(idx, { current: e.target.checked })}
                                  disabled={readonly}
                                  color="primary"
                                />
                              }
                              label="Currently working here"
                            />
                          </Grid>
                          {/* Details */}
                          <Grid item xs={12}>
                            <StyledTextField
                              label="Work Details / Responsibilities"
                              fullWidth
                              multiline
                              minRows={3}
                              required
                              value={item.details}
                              error={!!expErrors[idx]?.details}
                              helperText={expErrors[idx]?.details ? 'Please describe your work and responsibilities' : 'Add impact, projects, stack, achievements'}
                              onChange={(e) => !readonly && updateExp(idx, { details: e.target.value })}
                              disabled={readonly}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                    <NotesIcon color={expErrors[idx]?.details ? 'error' : 'primary'} />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                        </Grid>

                        {!readonly && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Tooltip title={expList.length > 1 ? 'Remove this experience' : 'At least one experience is required'}>
                              <span>
                                <Button
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => removeExperience(idx)}
                                  disabled={expList.length <= 1}
                                >
                                  Remove
                                </Button>
                              </span>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </AnimatedSection>

        {/* Education */}
        <AnimatedSection sx={{ mb: 4 }}>
          <GlassCard>
            <CardContent sx={{ p: 5 }}>
              <SectionTitle variant="h5" gutterBottom>
                <SchoolIcon /> Education
              </SectionTitle>
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    label="10th Grade"
                    fullWidth
                    required
                    value={edu.tenth}
                    error={!!errors.tenth}
                    helperText={errors.tenth ? 'This field is required' : 'School name & percentage/grade'}
                    onChange={(e) => !readonly && setEdu(s => ({ ...s, tenth: e.target.value }))}
                    disabled={readonly}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon color={errors.tenth ? 'error' : 'primary'} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    label="12th Grade"
                    fullWidth
                    required
                    value={edu.twelfth}
                    error={!!errors.twelfth}
                    helperText={errors.twelfth ? 'This field is required' : 'School name & percentage/grade'}
                    onChange={(e) => !readonly && setEdu(s => ({ ...s, twelfth: e.target.value }))}
                    disabled={readonly}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon color={errors.twelfth ? 'error' : 'primary'} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    label="Graduation"
                    fullWidth
                    required
                    value={edu.graduation}
                    error={!!errors.graduation}
                    helperText={errors.graduation ? 'This field is required' : 'Degree, college & year'}
                    onChange={(e) => !readonly && setEdu(s => ({ ...s, graduation: e.target.value }))}
                    disabled={readonly}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AchievementIcon color={errors.graduation ? 'error' : 'primary'} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    label="Post Graduation"
                    fullWidth
                    value={edu.postGraduation}
                    onChange={(e) => !readonly && setEdu(s => ({ ...s, postGraduation: e.target.value }))}
                    disabled={readonly}
                    helperText="Optional: Masters, PhD, etc."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AchievementIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </AnimatedSection>

        {/* Save Button */}
        {!readonly && (
          <Zoom in timeout={1000}>
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
              <SaveButton
                variant="contained"
                size="large"
                onClick={saveProfile}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ 
                  minWidth: 220,
                  animation: `${floatElevate} 3s ease-in-out infinite`,
                }}
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </SaveButton>
            </Box>
          </Zoom>
        )}

        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionComponent={Slide}
        >
          <Alert
            onClose={() => setToast(s => ({ ...s, open: false }))}
            severity={toast.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              borderRadius: 3,
              alignItems: 'center',
              fontWeight: 500,
            }}
            icon={toast.severity === 'success' ? <CheckIcon /> : <CloseIcon />}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </ProfileContainer>
    </LocalizationProvider>
  );
}
