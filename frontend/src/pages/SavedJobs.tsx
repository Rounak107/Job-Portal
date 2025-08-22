// frontend/src/pages/SavedJobs.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getSavedJobs, unsaveJob } from "../utils/savedJobs";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  description?: string;
  createdAt?: string;
  postedAt?: string;
};

export default function SavedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ids = getSavedJobs();
      if (ids.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      try {
        // Primary: bulk fetch via /jobs?ids=1,2,3
        const resp = await api.get("/jobs", { params: { ids: ids.join(",") }, withCredentials: true });
        const list = resp?.data?.jobs ?? [];

        // If backend returned empty (shouldn’t happen), fallback to per-id
        if (Array.isArray(list) && list.length > 0) {
          setJobs(list);
        } else {
          const perId = await Promise.all(
            ids.map(async (id) => {
              try {
                const r = await api.get(`/jobs/${id}`);
                return r.data;
              } catch {
                return null;
              }
            })
          );
          setJobs(perId.filter(Boolean) as Job[]);
        }
      } catch (e: any) {
        // Final fallback: attempt per-ID if bulk failed (proxy/CORS)
        try {
          const ids = getSavedJobs();
          const perId = await Promise.all(
            ids.map(async (id) => {
              try {
                const r = await api.get(`/jobs/${id}`);
                return r.data;
              } catch {
                return null;
              }
            })
          );
          setJobs(perId.filter(Boolean) as Job[]);
        } catch (err: any) {
          setError(err?.message || "Failed to load saved jobs.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (jobs.length === 0)
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-2">Saved Jobs</h1>
        <p className="text-gray-600 mb-4">No saved jobs yet.</p>
        <Link to="/" className="text-indigo-600 underline">Browse jobs</Link>
      </div>
    );

  const handleUnsave = (id: number) => {
    unsaveJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Saved Jobs</h1>
        <Link to="/" className="text-indigo-600 underline">Back to jobs</Link>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="border p-4 rounded shadow bg-white">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/jobs/${job.id}_${String(job.title).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}>
                  <h3 className="text-lg font-semibold hover:underline">{job.title}</h3>
                </Link>
                <p className="text-sm text-gray-600">
                  {job.company} — {job.location}
                </p>
              </div>
              <button
                onClick={() => handleUnsave(job.id)}
                className="text-xs px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                aria-label="Unsave job"
              >
                Unsave
              </button>
            </div>
            {job.description && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                {job.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
