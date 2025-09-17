import { useEffect, useState } from "react";
import { api } from "../../api";

type Recruiter = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Recruiter[]>("/admin/recruiters")
      .then((res) => setRecruiters(res.data))
      .catch((err) => console.error("Failed to fetch recruiters", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading recruiters...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recruiters</h1>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Created</th>
          </tr>
        </thead>
        <tbody>
          {recruiters.map((r) => (
            <tr key={r.id}>
              <td className="p-2 border">{r.id}</td>
              <td className="p-2 border">{r.name}</td>
              <td className="p-2 border">{r.email}</td>
              <td className="p-2 border">
                {new Date(r.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
