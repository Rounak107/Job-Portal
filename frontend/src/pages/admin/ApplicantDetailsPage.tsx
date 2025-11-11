import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";

type ApplicantDetails = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  applicationCount: number;
  latestApplication?: {
    jobId?: number | null;
    jobTitle?: string | null;
    company?: string | null;
    status?: string | null;
    appliedAt?: string | null;
  };
};

export default function ApplicantDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [applicant, setApplicant] = useState<ApplicantDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const adminEmail = localStorage.getItem("adminEmail");
    
    api
      .get<ApplicantDetails>(`/admin/applicants/${id}`, {
        headers: {
          'x-admin-email': adminEmail
        }
      })
      .then((res: any) => setApplicant(res.data))
      .catch((err: any) => console.error("Failed to fetch applicant details", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading applicant details...</div>;
  }

  if (!applicant) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Applicant not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link to="/admin/applicants" className="text-blue-600 hover:underline">
            ← Back to Applicants
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Applicant Details - {applicant.name}</h1>
          <div className="grid grid-cols-2 gap-4">
            <div><strong>ID:</strong> {applicant.id}</div>
            <div><strong>Name:</strong> {applicant.name}</div>
            <div><strong>Email:</strong> {applicant.email}</div>
            <div><strong>Total Applications:</strong> {applicant.applicationCount}</div>
            <div><strong>Member Since:</strong> {new Date(applicant.createdAt).toLocaleDateString()}</div>
            {applicant.latestApplication && (
              <>
                <div><strong>Latest Job:</strong> {applicant.latestApplication.jobTitle || 'N/A'}</div>
                <div><strong>Company:</strong> {applicant.latestApplication.company || 'N/A'}</div>
                <div><strong>Status:</strong> {applicant.latestApplication.status || 'N/A'}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}