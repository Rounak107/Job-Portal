import { useEffect, useState } from "react";

type Applicant = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  location?: string;
  skills?: string;
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/admin/applicants`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setApplicants)
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Applicants</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Location</th>
            <th className="p-2 border">Skills</th>
            <th className="p-2 border">Joined</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((a) => (
            <tr key={a.id}>
              <td className="p-2 border">{a.id}</td>
              <td className="p-2 border">{a.name}</td>
              <td className="p-2 border">{a.email}</td>
              <td className="p-2 border">{a.location || "-"}</td>
              <td className="p-2 border">{a.skills || "-"}</td>
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
