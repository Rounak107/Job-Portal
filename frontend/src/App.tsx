import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import JobsPage from "./components/JobsPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Header from "./components/Header";
import { AuthProvider } from "./auth/AuthProvider";
import PrivateRoute from "./components/PrivateRoute";
import JobDetails from "./pages/JobDetails";
import RecruiterApplicants from './pages/RecruiterApplicants';
import JobCreate from './pages/JobCreate';
import SavedJobs from "./pages/SavedJobs";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const theme = createTheme({
  typography: { fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif` },
  palette: { background: { default: "#f7f7fb" } },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Header />
          <main className="max-w-6xl mx-auto p-4">
            <Routes>
              <Route path="/" element={<JobsPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/jobs/:idSlug" element={<JobDetails/>} />
              <Route
                path="/recruiter"
                element={
                  <PrivateRoute roles={['RECRUITER','ADMIN']}>
                    <RecruiterDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/recruiter/applicants"
                element={
                  <PrivateRoute roles={['RECRUITER','ADMIN']}>
                    <RecruiterApplicants />
                  </PrivateRoute>
                }
              />
              <Route
                path="/jobs/new"
                element={
                  <PrivateRoute roles={['RECRUITER', 'ADMIN']}>
                    <JobCreate />
                  </PrivateRoute>
                }
              />

              {/* ONLY USER can open their own profile */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute roles={['USER']}>
                    <Profile />
                  </PrivateRoute>
                }
              />
              {/* Recruiter/Admin can view applicant profile by id */}
              <Route
                path="/profile/:userId"
                element={
                  <PrivateRoute roles={['RECRUITER','ADMIN']}>
                    <Profile />
                  </PrivateRoute>
                }
              />

              <Route path="/saved-jobs" element={<SavedJobs />} />
            </Routes>
          </main>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
