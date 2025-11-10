import { useEffect, useState } from "react";
import { api } from "../../api";
import { useNavigate } from "react-router-dom"; // Added for navigation

type LatestApplication = {
  jobId?: number | null;
  jobTitle?: string | null;
  company?: string | null;
  status?: string | null;
  appliedAt?: string | null;
};

type Applicant = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  applicationCount: number;
  latestApplication?: LatestApplication | null;
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Added for navigation

   useEffect(() => {
    const adminEmail = localStorage.getItem("adminEmail"); // ✅ Get admin email
    
    api
      .get<Applicant[]>("/admin/applicants", {
        headers: {
          'x-admin-email': adminEmail // ✅ Add email header
        }
      })
      .then((res) => setApplicants(res.data))
      .catch((err) => console.error("Failed to fetch applicants", err))
      .finally(() => setLoading(false));
  }, []);;

  const getStatusColor = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityLevel = (count: number) => {
    if (count >= 10) return { label: 'High Activity', color: 'bg-green-500', width: '100%' };
    if (count >= 5) return { label: 'Moderate Activity', color: 'bg-yellow-500', width: '60%' };
    if (count >= 1) return { label: 'Low Activity', color: 'bg-blue-500', width: '30%' };
    return { label: 'No Activity', color: 'bg-gray-400', width: '10%' };
  };

  // Function to handle view profile redirect
  const handleViewProfile = (applicantId: number) => {
    window.open(`https://www.jobrun.in/profile/${applicantId}`, '_blank');
  };

  // Function to handle applications redirect
  const handleViewApplications = () => {
    navigate('/admin/applications');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-56 mb-8"></div>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="h-16 bg-gray-100"></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 border-b border-gray-100 bg-white"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalApplications = applicants.reduce((sum, a) => sum + a.applicationCount, 0);
  const activeApplicants = applicants.filter(a => a.applicationCount > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Applicants Dashboard</h1>
          <p className="text-gray-600">Monitor job seekers and their application activities</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                  <p className="text-2xl font-bold text-indigo-600">{applicants.length}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Applicants</p>
                  <p className="text-2xl font-bold text-green-600">{activeApplicants}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-purple-600">{totalApplications}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Applications</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {applicants.length > 0 ? (totalApplications / applicants.length).toFixed(1) : '0'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
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
                    Applicant Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Activity Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Latest Application
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Member Since
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    View Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {applicants.map((a, index) => {
                  const activity = getActivityLevel(a.applicationCount);
                  
                  return (
                    <tr 
                      key={a.id}
                      className="hover:bg-gray-50 transition-all duration-200 animate-fade-in-row group"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Applicant Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                              <span className="text-white font-semibold text-lg">
                                {a.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                            <div className="text-sm text-gray-500">{a.email}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              <span className="bg-gray-100 px-2 py-0.5 rounded-full">ID: {a.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Activity Level */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <button 
                              onClick={handleViewApplications}
                              className="text-sm font-medium text-gray-700 hover:text-indigo-600 hover:underline cursor-pointer"
                            >
                              {a.applicationCount} applications
                            </button>
                            <span className={`text-xs px-2 py-1 rounded-full ${activity.color === 'bg-green-500' ? 'bg-green-100 text-green-800' : 
                              activity.color === 'bg-yellow-500' ? 'bg-yellow-100 text-yellow-800' : 
                              activity.color === 'bg-blue-500' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                              {activity.label}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${activity.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                              style={{ width: activity.width }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Latest Application */}
                      <td className="px-6 py-4">
                        {a.latestApplication?.jobTitle ? (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-900">
                              {a.latestApplication.jobTitle}
                            </div>
                            <div className="text-sm text-gray-600">
                              at <span className="font-medium">{a.latestApplication.company || "Unknown Company"}</span>
                            </div>
                            {a.latestApplication.status && (
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(a.latestApplication.status)}`}>
                                  {a.latestApplication.status}
                                </span>
                                {a.latestApplication.appliedAt && (
                                  <span className="text-xs text-gray-500">
                                    {Math.floor((Date.now() - new Date(a.latestApplication.appliedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">No applications yet</div>
                        )}
                      </td>

                      {/* Member Since */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {new Date(a.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </td>

                      {/* View Details Column */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewProfile(a.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                        >
                          View Profile
                        </button>
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