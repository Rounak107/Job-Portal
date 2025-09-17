// frontend/src/pages/admin/ApplicationsPage.tsx
import { useEffect, useState } from "react";
import { api } from "../../api";

type Application = {
  id: number;
  jobId?: number | null;
  jobTitle?: string;
  jobCompany?: string;
  applicantId?: number | null;
  applicantName?: string;
  applicantEmail?: string;
  status: string;
  createdAt: string;
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Application[]>("/admin/applications")
      .then((res) => setApps(res.data))
      .catch((err) => console.error("Failed to fetch applications", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading applications...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Applications</h1>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Job (Role)</th>
            <th className="p-2 border">Company</th>
            <th className="p-2 border">Applicant</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Created</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id}>
              <td className="p-2 border">{app.id}</td>
              <td className="p-2 border">{app.jobTitle ?? "-"}</td>
              <td className="p-2 border">{app.jobCompany ?? "-"}</td>
              <td className="p-2 border">{app.applicantName ?? "-"}</td>
              <td className="p-2 border">{app.applicantEmail ?? "-"}</td>
              <td className="p-2 border">{app.status}</td>
              <td className="p-2 border">{new Date(app.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
