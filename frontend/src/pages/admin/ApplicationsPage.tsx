import { useEffect, useState } from "react";
import { api } from "../../api";

type Application = {
  id: number;
  jobTitle: string;
  applicantName: string;
  status: string;
  createdAt: string;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Application[]>("/admin/applications")
      .then((res) => setApplications(res.data))
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
            <th className="p-2 border">Job</th>
            <th className="p-2 border">Applicant</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Created</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td className="p-2 border">{a.id}</td>
              <td className="p-2 border">{a.jobTitle}</td>
              <td className="p-2 border">{a.applicantName}</td>
              <td className="p-2 border">{a.status}</td>
              <td className="p-2 border">
                {new Date(a.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
