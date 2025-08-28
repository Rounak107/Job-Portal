// frontend/src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  CircularProgress,
  Alert,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  LinearProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as RegisterIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

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

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Styled Components
const RegisterContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.success.main}15 0%, ${theme.palette.info.main}15 100%)`,
  padding: theme.spacing(2),
}));

const RegisterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  maxWidth: 450,
  width: '100%',
  background: 'rgba(255, 255, 255, 0.95)',
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
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  }
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
    }
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5, 3),
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 600,
  background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
    background: `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
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
  background: 'rgba(255, 255, 255, 0.8)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'inherit',
  zIndex: 10,
});

const AnimatedTitle = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.info.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: theme.spacing(2),
}));

const RoleCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected?: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(2),
  border: `2px solid ${selected ? theme.palette.success.main : theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1.5),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  background: selected ? 
    `linear-gradient(45deg, ${theme.palette.success.main}10, ${theme.palette.success.light}10)` : 
    'transparent',
  animation: selected ? `${slideInRight} 0.3s ease-out` : 'none',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderColor: theme.palette.success.main,
  }
}));

const PasswordStrengthIndicator = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const PasswordRequirements = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.grey[200]}`,
}));

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER' as 'USER' | 'RECRUITER'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const steps = ['Personal Info', 'Account Setup', 'Role Selection'];

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 25) return 'error';
    if (strength < 50) return 'warning';
    if (strength < 75) return 'info';
    return 'success';
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const getPasswordRequirements = (password: string) => {
    return [
      {
        text: 'At least 8 characters',
        met: password.length >= 8
      },
      {
        text: 'One uppercase letter',
        met: /[A-Z]/.test(password)
      },
      {
        text: 'One number',
        met: /[0-9]/.test(password)
      },
      {
        text: 'One special character',
        met: /[^A-Za-z0-9]/.test(password)
      }
    ];
  };

  const isPasswordStrong = (password: string) => {
    return calculatePasswordStrength(password) === 100;
  };

  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Full name is required';
        } else if (value.length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else {
          errors.name = '';
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          errors.email = 'Email is required';
        } else if (!emailRegex.test(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          errors.email = '';
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (!isPasswordStrong(value)) {
          errors.password = 'Password must be strong (meet all requirements)';
        } else {
          errors.password = '';
        }
        setPasswordStrength(calculatePasswordStrength(value));
        break;
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          errors.confirmPassword = '';
        }
        break;
    }
    
    setFieldErrors(errors);
    return !errors[field as keyof typeof errors];
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
    
    // Validate confirm password when password changes
    if (field === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.name && !fieldErrors.name;
      case 1:
        return formData.email && formData.password && formData.confirmPassword &&
               !fieldErrors.email && !fieldErrors.password && !fieldErrors.confirmPassword &&
               isPasswordStrong(formData.password);
      case 2:
        return formData.role;
      default:
        return false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);
    
    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isPasswordStrong(formData.password)) {
      if (!isPasswordStrong(formData.password)) {
        setError('Password must be strong to create an account');
      }
      return;
    }

    setError(null);
    setBusy(true);
    
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Fade in timeout={500}>
            <Box>
              <StyledTextField
                label="Full Name"
                fullWidth
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                disabled={busy}
              />
            </Box>
          </Fade>
        );
      case 1:
        return (
          <Fade in timeout={500}>
            <Box>
              <StyledTextField
                label="Email Address"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
                disabled={busy}
              />

              <StyledTextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
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
                sx={{ mb: 1 }}
                disabled={busy}
              />

              {formData.password && (
                <PasswordStrengthIndicator>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="caption">Password Strength:</Typography>
                    <Chip
                      label={getPasswordStrengthLabel(passwordStrength)}
                      size="small"
                      color={getPasswordStrengthColor(passwordStrength) as any}
                      variant="outlined"
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength}
                    color={getPasswordStrengthColor(passwordStrength) as any}
                    sx={{ borderRadius: 1, height: 6, mb: 2 }}
                  />
                  
                  <PasswordRequirements>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
                      Password must include:
                    </Typography>
                    {getPasswordRequirements(formData.password).map((req, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={1} mb={0.5}>
                        <CheckIcon 
                          sx={{ 
                            fontSize: 16, 
                            color: req.met ? 'success.main' : 'grey.400' 
                          }} 
                        />
                        <Typography 
                          variant="caption" 
                          color={req.met ? 'success.main' : 'text.secondary'}
                          sx={{ textDecoration: req.met ? 'none' : 'none' }}
                        >
                          {req.text}
                        </Typography>
                      </Box>
                    ))}
                  </PasswordRequirements>
                </PasswordStrengthIndicator>
              )}

              <StyledTextField
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={formData.confirmPassword}
                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                error={!!fieldErrors.confirmPassword}
                helperText={fieldErrors.confirmPassword}
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
                disabled={busy}
              />
            </Box>
          </Fade>
        );
      case 2:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h6" mb={3} textAlign="center">
                What describes you best?
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <RoleCard
                  selected={formData.role === 'USER'}
                  onClick={() => handleFieldChange('role', 'USER')}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <SchoolIcon color={formData.role === 'USER' ? 'success' : 'disabled'} />
                    <Box>
                      <Typography variant="h6">Job Seeker</Typography>
                      <Typography variant="body2" color="text.secondary">
                        I'm looking for job opportunities
                      </Typography>
                    </Box>
                    {formData.role === 'USER' && <CheckIcon color="success" />}
                  </Box>
                </RoleCard>
                
                <RoleCard
                  selected={formData.role === 'RECRUITER'}
                  onClick={() => handleFieldChange('role', 'RECRUITER')}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <WorkIcon color={formData.role === 'RECRUITER' ? 'success' : 'disabled'} />
                    <Box>
                      <Typography variant="h6">Recruiter</Typography>
                      <Typography variant="body2" color="text.secondary">
                        I'm hiring and posting jobs
                      </Typography>
                    </Box>
                    {formData.role === 'RECRUITER' && <CheckIcon color="success" />}
                  </Box>
                </RoleCard>
              </Box>
            </Box>
          </Fade>
        );
      default:
        return null;
    }
  };

  return (
    <RegisterContainer maxWidth={false}>
      <Fade in timeout={800}>
        <RegisterPaper elevation={0}>
          {busy && (
            <LoadingOverlay>
              <CircularProgress size={50} thickness={4} />
              <Typography variant="body2" mt={2}>Creating your account...</Typography>
            </LoadingOverlay>
          )}
          
          <AnimatedTitle variant="h4">
            Join Our Platform
          </AnimatedTitle>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            textAlign="center" 
            mb={4}
            sx={{ opacity: 0.8 }}
          >
            Create your account to get started
          </Typography>

          <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-message': { width: '100%' }
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Slide>
          )}

          <Box component="form" onSubmit={onSubmit} sx={{ position: 'relative' }}>
            <Box mb={4} minHeight={200}>
              {renderStepContent()}
            </Box>

            <Box display="flex" justifyContent="space-between" gap={2}>
              <Button
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0 || busy}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!isStepValid(currentStep) || busy}
                  variant="contained"
                  sx={{ borderRadius: 2 }}
                >
                  Next
                </Button>
              ) : (
                <StyledButton
                  type="submit"
                  disabled={busy || !isStepValid(currentStep)}
                  startIcon={busy ? null : <RegisterIcon />}
                >
                  {busy ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} color="inherit" />
                      Creating Account...
                    </Box>
                  ) : (
                    'Create Account'
                  )}
                </StyledButton>
              )}
            </Box>
          </Box>

          <Box textAlign="center" mt={3} pt={3} borderTop="1px solid" borderColor="divider">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: 'success.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </RegisterPaper>
      </Fade>
    </RegisterContainer>
  );
}