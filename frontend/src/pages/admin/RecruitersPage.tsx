import { useEffect, useState } from "react";

type Recruiter = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/admin/recruiters`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setRecruiters)
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Recruiters</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Joined</th>
          </tr>
        </thead>
        <tbody>
          {recruiters.map((r) => (
            <tr key={r.id}>
              <td className="p-2 border">{r.id}</td>
              <td className="p-2 border">{r.name}</td>
              <td className="p-2 border">{r.email}</td>
              <td className="p-2 border">{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
