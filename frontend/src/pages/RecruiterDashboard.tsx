import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Button, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Add, Group, Visibility, Work, ExitToApp } from '@mui/icons-material';
import CountUp from 'react-countup';

const DashboardContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(-45deg, ${theme.palette.background.default}, ${theme.palette.action.hover}, ${theme.palette.background.paper})`,
  backgroundSize: '400% 400%',
  animation: `gradientShift 15s ease infinite`,
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const StatCard = ({ icon: Icon, color, value, label }) => (
  <Card sx={{ textAlign: 'center', borderRadius: 3, boxShadow: 3 }}>
    <CardContent>
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1,
        }}
      >
        <Icon sx={{ color: '#fff', fontSize: 30 }} />
      </Box>
      <Typography variant="h4" fontWeight={800} color="primary.main" mb={0}>
        <CountUp end={value} duration={2} />
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.secondary">
        {label}
      </Typography>
    </CardContent>
  </Card>
);

export default function RecruiterDashboard() {
  const stats = [
    { label: 'Jobs Posted', value: 1, icon: Work, color: '#1976d2' },
    { label: 'Total Views', value: 3, icon: Visibility, color: '#43a047' },
    { label: 'Applications', value: 1, icon: Group, color: '#fb8c00' },
    { label: 'Login Sessions', value: 5, icon: ExitToApp, color: '#8e24aa' },
  ];

  return (
    <DashboardContainer>
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Profile Card */}
          <Card sx={{ p: 2, borderRadius: 3, mb: 3, display: 'flex', alignItems: 'center', boxShadow: 3 }}>
            <Avatar sx={{ bgcolor: '#1976d2', width: 70, height: 70, mr: 2 }}>A</Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Arnab</Typography>
              <Typography variant="body2" color="text.secondary">b120053@iiit-bh.ac.in</Typography>
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1, borderRadius: 5, backgroundColor: '#1976d2' }}
              >
                1 Active Job
              </Button>
            </Box>
          </Card>

          {/* Stats Row */}
          <Grid container spacing={2} mb={3}>
            {stats.map((stat) => (
              <Grid item xs={6} sm={3} key={stat.label}>
                <StatCard {...stat} />
              </Grid>
            ))}
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2 }}>
                <Typography variant="h6" fontWeight={700}>Views & Applications Trend</Typography>
                {/* Insert Chart Component */}
                <Box sx={{ height: 200, bgcolor: '#f5f5f5', borderRadius: 2, mt: 2 }} />
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2 }}>
                <Typography variant="h6" fontWeight={700}>Performance Overview</Typography>
                {/* Insert Chart Component */}
                <Box sx={{ height: 200, bgcolor: '#f5f5f5', borderRadius: 2, mt: 2 }} />
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Quick Actions</Typography>
            <Button fullWidth variant="contained" sx={{ mb: 2, bgcolor: '#8e24aa', borderRadius: 3 }} startIcon={<Add />}>
              Create Job
            </Button>
            <Button fullWidth variant="contained" sx={{ bgcolor: '#7b1fa2', borderRadius: 3 }} startIcon={<Group />}>
              View Applicants
            </Button>
          </Card>

          <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>Top Performing Jobs</Typography>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, mt: 2 }}>
              <Typography variant="subtitle1">AIML</Typography>
              <Typography variant="body2">1 application</Typography>
            </Box>
          </Card>

          <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2 }}>
            <Typography variant="h6" fontWeight={700}>Quick Insights</Typography>
            <Box sx={{ mt: 2, p: 1, bgcolor: '#e8f5e9', borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={700}>Average applications per job: 1</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
}
