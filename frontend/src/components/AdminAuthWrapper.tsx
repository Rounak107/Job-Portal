import { useState, useEffect } from 'react';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLogin from '../pages/admin/AdminLogin';
import RecruitersPage from '../pages/admin/RecruitersPage';
import ApplicantsPage from '../pages/admin/ApplicantsPage';
import Jobs from '../pages/admin/Jobs';
import ApplicationsPage from '../pages/admin/ApplicationsPage';
import RecruiterDetailsPage from '../pages/admin/RecruiterDetailsPage';
import ApplicantDetailsPage from '../pages/admin/ApplicantDetailsPage';
import ApplicationDetailsPage from '../pages/admin/ApplicationDetailsPage';
import { useLocation } from 'react-router-dom';
import { setAuthToken } from '../api';

export default function AdminAuthWrapper() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        localStorage.setItem("jobportal_token", "dummy-admin");
        setAuthToken("dummy-admin");
      }
      
      setLoading(false);
    };

    checkAdminStatus();
    const interval = setInterval(checkAdminStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  // ✅ FIXED: Handle all dynamic routes
  const path = location.pathname;

  // Recruiter details
  if (path.startsWith('/admin/recruiters/')) {
    return <RecruiterDetailsPage />;
  }

  // Applicant details
  if (path.startsWith('/admin/applicants/')) {
    return <ApplicantDetailsPage />;
  }

  // Application details
  if (path.startsWith('/admin/applications/')) {
    return <ApplicationDetailsPage />;
  }

  // Static routes
  if (path === '/admin/recruiters') {
    return <RecruitersPage />;
  }

  if (path === '/admin/applicants') {
    return <ApplicantsPage />;
  }

  if (path === '/admin/jobs') {
    return <Jobs />;
  }

  if (path === '/admin/applications') {
    return <ApplicationsPage />;
  }

  if (path === '/admin') {
    return <AdminDashboard />;
  }

  // Fallback for any other admin routes
  return <AdminDashboard />;
}