import { useEffect, useState } from "react";
import { api } from "../../api";
import { Link } from 'react-router-dom';

type Recruiter = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  jobCount: number;
  applicationsCount: number;
  applicationsByStatus: Record<string, number>;
};

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    const adminEmail = localStorage.getItem("adminEmail"); // ✅ Get admin email
    
    api
      .get<Recruiter[]>("/admin/recruiters", {
        headers: {
          'x-admin-email': adminEmail // ✅ Add email header
        }
      })
      .then((res) => setRecruiters(res.data))
      .catch((err) => console.error("Failed to fetch recruiters", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-8"></div>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="h-16 bg-gray-100"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 border-b border-gray-100 bg-white"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recruiters Dashboard</h1>
          <p className="text-gray-600">Manage and monitor recruiter activities</p>
          <div className="mt-4 flex items-center space-x-6">
            <div className="bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="text-sm text-gray-500">Total Recruiters</span>
              <span className="ml-2 font-semibold text-blue-600">{recruiters.length}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="text-sm text-gray-500">Active Jobs</span>
              <span className="ml-2 font-semibold text-green-600">
                {recruiters.reduce((sum, r) => sum + r.jobCount, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Recruiter Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Application Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    View Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recruiters.map((r, index) => {
                  const accepted = r.applicationsByStatus?.ACCEPTED ?? 0;
                  const pending = r.applicationsByStatus?.PENDING ?? 0;
                  const rejected = r.applicationsByStatus?.REJECTED ?? 0;
                  const total = accepted + pending + rejected;
                  
                  return (
                    <tr 
                      key={r.id}
                      className="hover:bg-gray-50 transition-all duration-200 animate-fade-in-row"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Recruiter Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {r.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{r.name}</div>
                            <div className="text-sm text-gray-500">{r.email}</div>
                            <div className="text-xs text-gray-400">ID: {r.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                              Jobs
                            </div>
                            <span className="text-sm font-semibold">{r.jobCount}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                              Apps
                            </div>
                            <span className="text-sm font-semibold">{r.applicationsCount}</span>
                          </div>
                        </div>
                      </td>

                      {/* Application Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Accepted</span>
                            <div className="flex items-center">
                              <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${total > 0 ? (accepted / total) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-green-600">{accepted}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Pending</span>
                            <div className="flex items-center">
                              <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-yellow-600">{pending}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Rejected</span>
                            <div className="flex items-center">
                              <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${total > 0 ? (rejected / total) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-red-600">{rejected}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(r.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </td>

                      <td className="px-6 py-4">
  <Link 
    to={`/admin/recruiters/${r.id}`}
    className="text-blue-600 font-medium hover:underline"
  >
    View Details
  </Link>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fade-in-row {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slide-up 0.8s ease-out forwards;
  }
  
  .animate-fade-in-row {
    opacity: 0;
    animation: fade-in-row 0.5s ease-out forwards;
  }
`}</style>
    </div>
  );
}