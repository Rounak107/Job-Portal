import { useEffect, useState } from "react";
import { api } from "../../api";

type Applicant = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Applicant[]>("/admin/applicants")
      .then((res) => setApplicants(res.data))
      .catch((err) => console.error("Failed to fetch applicants", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading applicants...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Applicants</h1>
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
          {applicants.map((a) => (
            <tr key={a.id}>
              <td className="p-2 border">{a.id}</td>
              <td className="p-2 border">{a.name}</td>
              <td className="p-2 border">{a.email}</td>
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
