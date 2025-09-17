import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Stats = {
  totalRecruiters: number;
  totalApplicants: number;
  totalJobs: number;
  totalApplications: number;
  applicationsByStatus: { status: string; _count: { status: number } }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/admin/stats`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return <p className="p-6">Loading admin stats...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Summary Cards */}
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

      {/* Applications by Status */}
      <h2 className="text-xl font-semibold mb-2">Applications by Status</h2>
      <ul className="list-disc ml-6">
        {stats.applicationsByStatus.map((row) => (
          <li key={row.status}>
            {row.status}: {row._count.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
