import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
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
  const navigate = useNavigate(); // Add this hook

  useEffect(() => {
    api
      .get<Job[]>("/admin/jobs")
      .then((res) => setJobs(res.data))
      .catch((err) => console.error("Failed to fetch jobs", err))
      .finally(() => setLoading(false));
  }, []);

  const getJobAge = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return { label: 'Today', color: 'bg-green-100 text-green-800' };
    if (days <= 7) return { label: `${days}d ago`, color: 'bg-blue-100 text-blue-800' };
    if (days <= 30) return { label: `${days}d ago`, color: 'bg-yellow-100 text-yellow-800' };
    return { label: `${days}d ago`, color: 'bg-gray-100 text-gray-800' };
  };

  const getCompanyInitials = (company: string) => {
    return company
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getCompanyColors = (company: string) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600',
      'from-teal-400 to-teal-600',
    ];
    const index = company.length % colors.length;
    return colors[index];
  };

   // Add this function to handle navigation
  const handleViewDetails = (job: Job) => {
    // Create a URL-friendly slug from job title
    const slug = `${job.id}_${job.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    navigate(`/jobs/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const recentJobs = jobs.filter(job => {
    const days = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  }).length;

  const companiesCount = new Set(jobs.map(job => job.company)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Jobs Portal</h1>
          <p className="text-gray-600">Manage and monitor all job listings across companies</p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-emerald-600">{jobs.length}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Jobs</p>
                  <p className="text-2xl font-bold text-blue-600">{recentJobs}</p>
                  <p className="text-xs text-gray-500">Last 7 days</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Companies</p>
                  <p className="text-2xl font-bold text-purple-600">{companiesCount}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {jobs.map((job, index) => {
    const jobAge = getJobAge(job.createdAt);
    const companyInitials = getCompanyInitials(job.company);
    const companyColors = getCompanyColors(job.company);
    
    return (
      <div
        key={job.id}
        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 group cursor-pointer animate-fade-in-card"
        style={{ animationDelay: `${index * 100}ms` }}
      >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-12 w-12 bg-gradient-to-br ${companyColors} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                        <span className="text-white font-bold text-sm">{companyInitials}</span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${jobAge.color}`}>
                          {jobAge.label}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-2 py-1 rounded-full">
                      <span className="text-xs text-gray-500 font-medium">#{job.id}</span>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {job.title}
                  </h3>

                  {/* Company */}
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">{job.company}</span>
                  </div>

                  {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6-6m0 0l6 6m-6-6v12" />
            </svg>
            <span className="text-xs text-gray-500">
              {new Date(job.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          
          {/* Update this button to use the navigation function */}
          <button 
            onClick={() => handleViewDetails(job)}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-xs font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    );
  })}
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500">There are no job listings available at the moment.</p>
            </div>
          )}
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
  
  @keyframes fade-in-card {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slide-up 0.8s ease-out forwards;
  }
  
  .animate-fade-in-card {
    opacity: 0;
    animation: fade-in-card 0.5s ease-out forwards;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`}</style>
    </div>
  );
}