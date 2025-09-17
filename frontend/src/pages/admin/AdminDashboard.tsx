// frontend/src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

type Stats = {
  totalRecruiters: number;
  totalApplicants: number;
  totalJobs: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get<Stats>("/admin/stats")
      .then((res) => {
        if (mounted) setStats(res.data);
      })
      .catch((err) => {
        console.error("failed admin stats", err);
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p className="p-6">Loading admin stats...</p>;
  if (!stats) return <p className="p-6">No stats available.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link to="/admin/recruiters" className="p-4 border rounded hover:bg-gray-50">
          Recruiters: <b>{stats.totalRecruiters}</b>
        </Link>
        <Link to="/admin/applicants" className="p-4 border rounded hover:bg-gray-50">
          Applicants: <b>{stats.totalApplicants}</b>
        </Link>
        <Link to="/admin/jobs" className="p-4 border rounded hover:bg-gray-50">
          Jobs: <b>{stats.totalJobs}</b>
        </Link>
        <Link to="/admin/applications" className="p-4 border rounded hover:bg-gray-50">
          Applications: <b>{stats.totalApplications}</b>
        </Link>
      </div>

      <h2 className="text-xl font-semibold mb-2">Applications by Status</h2>
      <ul className="list-disc ml-6">
        {Object.entries(stats.applicationsByStatus).map(([status, count]) => (
          <li key={status}>
            {status}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
}
