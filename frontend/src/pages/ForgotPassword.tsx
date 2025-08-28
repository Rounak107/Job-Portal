// frontend/src/pages/ForgotPassword.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  Fade,
  Slide,
  CircularProgress,
  Container,
  Link,
  Zoom,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ArrowBack as BackIcon,
  MarkEmailRead as EmailSentIcon,
  LockReset as ResetIcon,
  Info as InfoIcon,
  Login as LoginIcon,
  Timer as TimerIcon,
  Support as SupportIcon
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
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
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

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const sendEmail = keyframes`
  0% {
    transform: translateX(0) translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(100px) translateY(-20px) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translateX(200px) translateY(0) scale(0.6);
    opacity: 0;
  }
`;

// Styled Components
const ForgotContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.info.main}15 0%, ${theme.palette.primary.main}15 100%)`,
  padding: theme.spacing(2),
}));

const ForgotPaper = styled(Paper)(({ theme }) => ({
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
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: theme.spacing(1),
}));

const SuccessBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  animation: `${fadeInUp} 0.6s ease-out`,
}));

const InfoBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.info.main + '10',
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.info.main}30`,
}));

const EmailAnimation = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 100,
  height: 100,
  margin: '0 auto',
  '& .email-icon': {
    animation: `${sendEmail} 2s ease-out infinite`,
  }
}));

const StepIcon = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
}));

const FloatingIcon = styled(Box)({
  animation: `${float} 3s ease-in-out infinite`,
});

// Types
interface FormData {
  email: string;
}

interface FieldErrors {
  email?: string;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: ''
  });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState({
    email: false
  });
  const [redirectCountdown, setRedirectCountdown] = useState(30);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const errors: FieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    } else if (email.length > 255) {
      errors.email = 'Email address is too long';
    } else {
      errors.email = undefined;
    }
    
    setFieldErrors(errors);
    return !errors.email;
  };

  const handleFieldChange = (value: string) => {
    setFormData({ email: value });
    
    if (touched.email) {
      validateEmail(value);
    }
  };

  const handleFieldBlur = () => {
    setTouched({ email: true });
    validateEmail(formData.email);
  };

  // Countdown timer for redirect
  useEffect(() => {
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, redirectCountdown]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark field as touched
    setTouched({ email: true });
    
    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setBusy(true);
    
    try {
      const res = await api.post('/users/forgot-password', { 
        email: formData.email.trim().toLowerCase() 
      });
      
      setSuccess(true);
      setResendCooldown(60); // 60 second cooldown before allowing resend
      setRedirectCountdown(30); // Start countdown
    } catch (err: any) {
      const message = err?.response?.data?.message;
      
      // For security, don't reveal if email exists or not
      if (err?.response?.status === 404) {
        setSuccess(true); // Show success anyway for security
        setResendCooldown(60);
        setRedirectCountdown(30);
      } else {
        setError(
          typeof message === 'string' && message.length < 200
            ? message
            : 'Failed to send reset email. Please try again.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setError(null);
    setBusy(true);
    
    try {
      await api.post('/users/forgot-password', { 
        email: formData.email.trim().toLowerCase() 
      });
      setResendCooldown(60);
      setRedirectCountdown(30);
    } catch (err: any) {
      setError('Failed to resend email. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ForgotContainer maxWidth={false}>
      <Fade in timeout={800}>
        <ForgotPaper elevation={0}>
          {busy && (
            <LoadingOverlay>
              <CircularProgress size={50} thickness={4} />
              <Typography variant="body2" mt={2}>
                {success ? 'Resending email...' : 'Sending reset instructions...'}
              </Typography>
            </LoadingOverlay>
          )}
          
          {!success ? (
            <>
              <Box display="flex" justifyContent="center" mb={3}>
                <FloatingIcon>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: theme => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)',
                    }}
                  >
                    <ResetIcon sx={{ fontSize: 32, color: 'white' }} />
                  </Box>
                </FloatingIcon>
              </Box>

              <AnimatedTitle variant="h4">
                Forgot Your Password?
              </AnimatedTitle>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                textAlign="center" 
                mb={4}
              >
                No worries! Enter your email address and we'll send you instructions to reset your password.
              </Typography>

              {error && (
                <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      animation: `${shake} 0.5s ease-out`,
                    }}
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                </Slide>
              )}

              <Box component="form" onSubmit={onSubmit}>
                <StyledTextField
                  label="Email Address"
                  name="email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  onBlur={handleFieldBlur}
                  error={touched.email && !!fieldErrors.email}
                  helperText={touched.email && fieldErrors.email}
                  autoComplete="email"
                  autoFocus
                  placeholder="Enter your registered email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  disabled={busy}
                  sx={{ mb: 3 }}
                />

                <StyledButton
                  type="submit"
                  fullWidth
                  disabled={busy || !formData.email}
                  startIcon={busy ? null : <SendIcon />}
                >
                  {busy ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} color="inherit" />
                      Sending Instructions...
                    </Box>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </StyledButton>
              </Box>

              <InfoBox>
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                  <InfoIcon color="info" sx={{ fontSize: 20, mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="info.main" gutterBottom>
                      How it works:
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      1. Enter your registered email address
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      2. Check your inbox for reset instructions
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      3. Click the link in the email to reset your password
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      4. The link will expire in 1 hour for security
                    </Typography>
                  </Box>
                </Box>
              </InfoBox>

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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    <LoginIcon sx={{ fontSize: 16 }} />
                    Back to Login
                  </Link>
                </Typography>
                
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
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
                    Sign up here
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
                  <EmailSentIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>
              </Zoom>

              <Typography variant="h5" gutterBottom fontWeight={600} color="success.main">
                Check Your Email!
              </Typography>
              
              <Typography variant="body1" color="text.secondary" mb={1}>
                We've sent password reset instructions to:
              </Typography>
              
              <Typography 
                variant="body1" 
                fontWeight={600} 
                color="primary.main" 
                mb={3}
                sx={{
                  padding: 1.5,
                  backgroundColor: 'primary.main',
                  bgcolor: theme => theme.palette.primary.main + '10',
                  borderRadius: 2,
                  border: theme => `1px solid ${theme.palette.primary.main}30`,
                }}
              >
                {formData.email}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom fontWeight={600}>
                Next Steps:
              </Typography>

              <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Stepper orientation="vertical" activeStep={0}>
                  <Step active>
                    <StepLabel
                      StepIconComponent={() => (
                        <StepIcon>
                          <EmailIcon sx={{ fontSize: 20 }} />
                        </StepIcon>
                      )}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        Check your email inbox
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="caption" color="text.secondary">
                        Look for an email from our support team
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <EmailIcon sx={{ fontSize: 20 }} />
                        </Box>
                      )}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        Click the reset link
                      </Typography>
                    </StepLabel>
                  </Step>
                  
                  <Step>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <ResetIcon sx={{ fontSize: 20 }} />
                        </Box>
                      )}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        Create your new password
                      </Typography>
                    </StepLabel>
                  </Step>
                </Stepper>
              </Box>

              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    fontSize: 28
                  }
                }}
              >
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Didn't receive the email?
                </Typography>
                <Typography variant="caption" display="block" mb={1}>
                  • Check your spam or junk folder
                </Typography>
                <Typography variant="caption" display="block" mb={1}>
                  • Make sure you entered the correct email
                </Typography>
                <Typography variant="caption" display="block">
                  • Wait a few minutes for the email to arrive
                </Typography>
              </Alert>

              <Box display="flex" gap={2} flexDirection="column">
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || busy}
                  startIcon={resendCooldown > 0 ? <TimerIcon /> : <SendIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {resendCooldown > 0 
                    ? `Resend available in ${resendCooldown}s` 
                    : 'Resend Email'
                  }
                </Button>

                <StyledButton
                  onClick={() => navigate('/login')}
                  fullWidth
                  startIcon={<BackIcon />}
                >
                  Back to Login
                </StyledButton>
              </Box>

              <Box mt={3} pt={2} borderTop="1px solid" borderColor="divider">
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <InfoIcon sx={{ fontSize: 14 }} />
                    Redirecting to login in {redirectCountdown} seconds
                  </Box>
                </Typography>
              </Box>

              <Box mt={3} textAlign="center">
                <Link
                  component={RouterLink}
                  to="/support"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline',
                    }
                  }}
                >
                  <SupportIcon sx={{ fontSize: 16 }} />
                  Need help? Contact support
                </Link>
              </Box>
            </SuccessBox>
          )}
        </ForgotPaper>
      </Fade>
    </ForgotContainer>
  );
}