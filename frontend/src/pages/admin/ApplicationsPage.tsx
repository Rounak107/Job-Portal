import { useEffect, useState } from "react";

type Application = {
  id: number;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  status: string;
  createdAt: string;
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/admin/applications`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setApps)
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Applications</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Job</th>
            <th className="p-2 border">Applicant</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Applied</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id}>
              <td className="p-2 border">{app.id}</td>
              <td className="p-2 border">{app.jobTitle}</td>
              <td className="p-2 border">{app.applicantName}</td>
              <td className="p-2 border">{app.applicantEmail}</td>
              <td className="p-2 border">{app.status}</td>
              <td className="p-2 border">
                {new Date(app.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
