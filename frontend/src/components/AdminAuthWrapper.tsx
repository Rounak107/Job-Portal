import { useState, useEffect } from 'react';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLogin from '../pages/admin/AdminLogin';
import RecruitersPage from '../pages/admin/RecruitersPage';
import ApplicantsPage from '../pages/admin/ApplicantsPage';
import Jobs from '../pages/admin/Jobs';
import ApplicationsPage from '../pages/admin/ApplicationsPage';
import { useLocation } from 'react-router-dom';
import { setAuthToken } from '../api'; // ✅ Import setAuthToken

export default function AdminAuthWrapper() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      setIsAdmin(adminStatus);
      
      // ✅ Set token for ALL admin routes
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

  // Render the correct admin component based on route
  switch (location.pathname) {
    case '/admin/recruiters':
      return <RecruitersPage />;
    case '/admin/applicants':
      return <ApplicantsPage />;
    case '/admin/jobs':
      return <Jobs />;
    case '/admin/applications':
      return <ApplicationsPage />;
    case '/admin':
    default:
      return <AdminDashboard />;
  }
}