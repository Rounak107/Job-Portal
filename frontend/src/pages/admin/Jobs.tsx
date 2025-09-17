import { useEffect, useState } from "react";
import { api } from "../../api";

type Job = {
  id: number;
  title: string;
  company: string;
  createdAt: string;
};

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Job[]>("/admin/jobs")
      .then((res) => setJobs(res.data))
      .catch((err) => console.error("Failed to fetch jobs", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading jobs...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Jobs</h1>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Title</th>
            <th className="p-2 border">Company</th>
            <th className="p-2 border">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td className="p-2 border">{j.id}</td>
              <td className="p-2 border">{j.title}</td>
              <td className="p-2 border">{j.company}</td>
              <td className="p-2 border">
                {new Date(j.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
