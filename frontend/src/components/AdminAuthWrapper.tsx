import { useState, useEffect } from 'react';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLogin from '../pages/admin/AdminLogin';
import RecruitersPage from '../pages/admin/RecruitersPage';
import ApplicantsPage from '../pages/admin/ApplicantsPage';
import Jobs from '../pages/admin/Jobs';
import ApplicationsPage from '../pages/admin/ApplicationsPage';
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

  // ✅ SIMPLIFIED: Only handle main admin pages, redirect details to actual pages
  const path = location.pathname;

  // Static routes only
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