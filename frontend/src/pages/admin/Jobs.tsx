import { useEffect, useState } from "react";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  workMode: string;
  salaryMin?: number;
  salaryMax?: number;
  createdAt: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/admin/jobs`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setJobs)
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Jobs</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Title</th>
            <th className="p-2 border">Company</th>
            <th className="p-2 border">Location</th>
            <th className="p-2 border">Work Mode</th>
            <th className="p-2 border">Salary</th>
            <th className="p-2 border">Posted</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td className="p-2 border">{j.id}</td>
              <td className="p-2 border">{j.title}</td>
              <td className="p-2 border">{j.company}</td>
              <td className="p-2 border">{j.location}</td>
              <td className="p-2 border">{j.workMode}</td>
              <td className="p-2 border">
                {j.salaryMin
                  ? `₹${j.salaryMin} - ₹${j.salaryMax || "?"}`
                  : "Not specified"}
              </td>
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
