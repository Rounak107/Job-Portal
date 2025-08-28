// frontend/src/pages/ResetPassword.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  CircularProgress,
  Container,
  Chip,
  LinearProgress,
  Link,
  Collapse,
  Zoom
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  VpnKey as KeyIcon,
  ArrowBack as BackIcon,
  Security as SecurityIcon,
  CheckCircleOutline,
  CancelOutlined
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { api } from '../api';

// Animations
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

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
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

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
`;

// Styled Components
const ResetContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
  padding: theme.spacing(2),
}));

const ResetPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  borderRadius: theme.spacing(2),
  maxWidth: 480,
  width: '100%',
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  animation: `${fadeInUp} 0.6s ease-out`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-200px',
    width: '200px',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    animation: `${shimmer} 2s infinite`,
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    '&::before': {
      animation: 'none',
    }
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
      backgroundColor: '#fff',
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5, 3),
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 600,
  color: theme.palette.common.white,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    color: theme.palette.common.white,
  },
  '&:active': {
    transform: 'translateY(0)',
    animation: `${pulse} 0.6s ease-out`,
  },
  '&:disabled': {
    background: theme.palette.grey[300],
    color: theme.palette.grey[600],
  }
}));

const LoadingOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'inherit',
  zIndex: 10,
});

const AnimatedTitle = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: theme.spacing(1),
}));

const PasswordStrengthBar = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const PasswordRequirements = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.grey[200]}`,
}));

const TokenStatusBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'status'
})<{ status: 'valid' | 'invalid' | 'checking' }>(({ theme, status }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  backgroundColor: 
    status === 'valid' ? `${theme.palette.success.main}10` :
    status === 'invalid' ? `${theme.palette.error.main}10` :
    `${theme.palette.info.main}10`,
  border: `1px solid ${
    status === 'valid' ? theme.palette.success.main :
    status === 'invalid' ? theme.palette.error.main :
    theme.palette.info.main
  }40`,
  animation: status === 'invalid' ? `${shake} 0.5s ease-out` : 'none',
}));

const SuccessBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  animation: `${fadeInUp} 0.6s ease-out`,
}));

// Types
interface PasswordRequirement {
  text: string;
  met: boolean;
  icon?: React.ReactNode;
}

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false
  });

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 5;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;
    return Math.min(100, strength);
  };

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password]
  );

  const getPasswordStrengthColor = (strength: number): 'error' | 'warning' | 'info' | 'success' => {
    if (strength < 25) return 'error';
    if (strength < 50) return 'warning';
    if (strength < 75) return 'info';
    return 'success';
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const getPasswordRequirements = (password: string): PasswordRequirement[] => {
    return [
      {
        text: 'At least 8 characters',
        met: password.length >= 8,
      },
      {
        text: 'Contains uppercase letter',
        met: /[A-Z]/.test(password),
      },
      {
        text: 'Contains lowercase letter',
        met: /[a-z]/.test(password),
      },
      {
        text: 'Contains number',
        met: /[0-9]/.test(password),
      },
      {
        text: 'Contains special character',
        met: /[^A-Za-z0-9]/.test(password),
      }
    ];
  };

  const isPasswordStrong = (password: string): boolean => {
    const requirements = getPasswordRequirements(password);
    const criticalRequirements = requirements.slice(0, 4); // First 4 are critical
    return criticalRequirements.every(req => req.met);
  };

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenStatus('invalid');
        setError('No reset token found. Please use the link from your email.');
        return;
      }

      setTokenStatus('checking');
      try {
        // You might want to add an endpoint to verify token validity
        // await api.post('/users/verify-reset-token', { token });
        setTokenStatus('valid');
      } catch (err) {
        setTokenStatus('invalid');
        setError('Invalid or expired reset token. Please request a new password reset.');
      }
    };

    verifyToken();
  }, [token]);

  // Countdown redirect after success
  useEffect(() => {
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && redirectCountdown === 0) {
      navigate('/login');
    }
  }, [success, redirectCountdown, navigate]);

  const validateField = (field: keyof FormData, value: string): boolean => {
    const errors = { ...fieldErrors };
    
    switch (field) {
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (!isPasswordStrong(value)) {
          errors.password = 'Password must meet strength requirements';
        } else {
          errors.password = undefined;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          errors.confirmPassword = undefined;
        }
        break;
    }
    
    setFieldErrors(errors);
    return !errors[field];
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      validateField(field, value);
    }
    
    // Validate confirm password when password changes
    if (field === 'password' && touched.confirmPassword && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ password: true, confirmPassword: true });
    
    // Validate all fields
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);
    
    if (!isPasswordValid || !isConfirmPasswordValid || !isPasswordStrong(formData.password)) {
      setError('Please fix the errors below');
      return;
    }

    if (tokenStatus !== 'valid') {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    setError(null);
    setBusy(true);
    
    try {
      const res = await api.post('/users/reset-password', { 
        token, 
        password: formData.password 
      });
      
      setSuccess(true);
      setRedirectCountdown(5);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(
        typeof message === 'string' && message.length < 200
          ? message
          : 'Failed to reset password. Please try again or request a new reset link.'
      );
    } finally {
      setBusy(false);
    }
  };

  const strengthColor = getPasswordStrengthColor(passwordStrength);

  return (
    <ResetContainer maxWidth={false}>
      <Fade in timeout={800}>
        <ResetPaper elevation={0}>
          {busy && (
            <LoadingOverlay>
              <CircularProgress size={50} thickness={4} />
              <Typography variant="body2" mt={2}>Resetting your password...</Typography>
            </LoadingOverlay>
          )}
          
          {!success ? (
            <>
              <Box display="flex" justifyContent="center" mb={3}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: theme => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)',
                  }}
                >
                  <KeyIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
              </Box>

              <AnimatedTitle variant="h4">
                Reset Your Password
              </AnimatedTitle>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                textAlign="center" 
                mb={3}
              >
                Create a strong new password for your account
              </Typography>

              {tokenStatus !== 'checking' && (
                <Collapse in={tokenStatus !== 'checking'}>
                  <TokenStatusBox status={tokenStatus}>
                    {tokenStatus === 'valid' ? (
                      <>
                        <CheckCircleOutline color="success" />
                        <Typography variant="body2" color="success.main" fontWeight={500}>
                          Valid reset token detected
                        </Typography>
                      </>
                    ) : tokenStatus === 'invalid' ? (
                      <>
                        <CancelOutlined color="error" />
                        <Typography variant="body2" color="error.main" fontWeight={500}>
                          {error || 'Invalid or expired reset token'}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                          Verifying reset token...
                        </Typography>
                      </>
                    )}
                  </TokenStatusBox>
                </Collapse>
              )}

              {error && tokenStatus === 'valid' && (
                <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                    }}
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                </Slide>
              )}

              <Box 
                component="form" 
                onSubmit={onSubmit}
                sx={{ 
                  opacity: tokenStatus === 'invalid' ? 0.5 : 1,
                  pointerEvents: tokenStatus === 'invalid' ? 'none' : 'auto'
                }}
              >
                <StyledTextField
                  label="New Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => handleFieldBlur('password')}
                  error={touched.password && !!fieldErrors.password}
                  helperText={touched.password && fieldErrors.password}
                  autoComplete="new-password"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={busy}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  disabled={busy || tokenStatus !== 'valid'}
                />

                {formData.password && (
                  <Fade in timeout={300}>
                    <PasswordStrengthBar>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" fontWeight={500}>
                          Password Strength:
                        </Typography>
                        <Chip
                          label={getPasswordStrengthLabel(passwordStrength)}
                          size="small"
                          color={strengthColor}
                          variant="outlined"
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength}
                        sx={(theme) => ({
                          borderRadius: 1,
                          height: 6,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette[strengthColor].main,
                            borderRadius: 1,
                          },
                        })}
                      />
                    </PasswordStrengthBar>
                  </Fade>
                )}

                {formData.password && (
                  <Collapse in={!!formData.password}>
                    <PasswordRequirements>
                      <Typography 
                        variant="caption" 
                        fontWeight={600} 
                        color="text.secondary" 
                        display="block" 
                        mb={1.5}
                      >
                        Password Requirements:
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={0.75}>
                        {getPasswordRequirements(formData.password).map((req, index) => (
                          <Box key={index} display="flex" alignItems="center" gap={1}>
                            <Zoom in timeout={300 * (index + 1)}>
                              <Box>
                                {req.met ? (
                                  <CheckCircleOutline 
                                    sx={{ 
                                      fontSize: 18, 
                                      color: 'success.main' 
                                    }} 
                                  />
                                ) : (
                                  <CancelOutlined
                                    sx={{ 
                                      fontSize: 18, 
                                      color: 'grey.400' 
                                    }} 
                                  />
                                )}
                              </Box>
                            </Zoom>
                            <Typography 
                              variant="body2" 
                              color={req.met ? 'success.main' : 'text.secondary'}
                              sx={{ 
                                transition: 'color 0.3s ease',
                                fontWeight: req.met ? 500 : 400
                              }}
                            >
                              {req.text}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </PasswordRequirements>
                  </Collapse>
                )}

                <StyledTextField
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  error={touched.confirmPassword && !!fieldErrors.confirmPassword}
                  helperText={touched.confirmPassword && fieldErrors.confirmPassword}
                  autoComplete="new-password"
                  sx={{ mt: 3, mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          disabled={busy}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  disabled={busy || tokenStatus !== 'valid'}
                />

                <StyledButton
                  type="submit"
                  fullWidth
                  disabled={
                    busy || 
                    tokenStatus !== 'valid' || 
                    !formData.password || 
                    !formData.confirmPassword ||
                    !isPasswordStrong(formData.password)
                  }
                  startIcon={busy ? null : <SecurityIcon />}
                >
                  {busy ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} color="inherit" />
                      Resetting Password...
                    </Box>
                  ) : (
                    'Reset Password'
                  )}
                </StyledButton>
              </Box>

              <Box textAlign="center" mt={4} pt={3} borderTop="1px solid" borderColor="divider">
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{' '}
                  <Link
                    component={RouterLink}
                    to="/login"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    Back to Login
                  </Link>
                </Typography>
                
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Need a new reset link?{' '}
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    Request New Link
                  </Link>
                </Typography>
              </Box>
            </>
          ) : (
            <SuccessBox>
              <Zoom in timeout={500}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: theme => `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 3,
                    boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
                    animation: `${pulse} 2s infinite`,
                  }}
                >
                  <CheckIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>
              </Zoom>

              <Typography variant="h5" gutterBottom fontWeight={600} color="success.main">
                Password Reset Successful!
              </Typography>
              
              <Typography variant="body1" color="text.secondary" mb={3}>
                Your password has been successfully reset.
                You can now log in with your new password.
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={3}>
                Redirecting to login in {redirectCountdown} seconds...
              </Typography>

              <StyledButton
                onClick={() => navigate('/login')}
                fullWidth
                startIcon={<BackIcon />}
              >
                Go to Login Now
              </StyledButton>
            </SuccessBox>
          )}
        </ResetPaper>
      </Fade>
    </ResetContainer>
  );
}