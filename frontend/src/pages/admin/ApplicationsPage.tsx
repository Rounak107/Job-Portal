import { useEffect, useState } from "react";
import { api } from "../../api";

type Application = {
  id: number;
  jobId?: number | null;
  jobTitle?: string;
  jobCompany?: string;
  applicantId?: number | null;
  applicantName?: string;
  applicantEmail?: string;
  status: string;
  createdAt: string;
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const adminEmail = localStorage.getItem("adminEmail"); // ✅ Get admin email
    
    api
      .get<Application[]>("/admin/applications", {
        headers: {
          'x-admin-email': adminEmail // ✅ Add email header
        }
      })
      .then((res) => {
        setApps(res.data);
        setFilteredApps(res.data);
      })
      .catch((err) => console.error("Failed to fetch applications", err))
      .finally(() => setLoading(false));
  }, []);

  // Filter applications based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredApps(apps);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = apps.filter(
        (app) =>
          app.applicantName?.toLowerCase().includes(term) ||
          app.applicantEmail?.toLowerCase().includes(term) ||
          app.jobTitle?.toLowerCase().includes(term) ||
          app.jobCompany?.toLowerCase().includes(term) ||
          app.status.toLowerCase().includes(term)
      );
      setFilteredApps(filtered);
    }
  }, [searchTerm, apps]);

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✓',
          bgGradient: 'from-green-50 to-emerald-50',
          priority: 1
        };
      case 'PENDING':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏳',
          bgGradient: 'from-yellow-50 to-amber-50',
          priority: 2
        };
      case 'REJECTED':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '✗',
          bgGradient: 'from-red-50 to-pink-50',
          priority: 3
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '?',
          bgGradient: 'from-gray-50 to-slate-50',
          priority: 4
        };
    }
  };

  const getApplicantInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
  };

  const getCompanyInitials = (company?: string) => {
    if (!company) return '?';
    return company.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
  };

  const getTimeAgo = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-56 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = apps.reduce((acc, app) => {
    acc[app.status.toUpperCase()] = (acc[app.status.toUpperCase()] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentApplications = apps.filter(app => {
    const days = Math.floor((Date.now() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days <= 1;
  }).length;

  const uniqueCompanies = new Set(apps.map(app => app.jobCompany).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Applications Dashboard</h1>
              <p className="text-gray-600">Track and manage all job applications across the platform</p>
            </div>
            
            {/* Search Bar */}
            <div className="mt-4 md:mt-0 relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white/70 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-violet-600">{apps.length}</p>
                </div>
                <div className="h-12 w-12 bg-violet-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts.PENDING || 0}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.ACCEPTED || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent (24h)</p>
                  <p className="text-2xl font-bold text-indigo-600">{recentApplications}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Applications {filteredApps.length > 0 && `(${filteredApps.length})`}
            </h2>
            {searchTerm && (
              <span className="text-sm text-gray-500">
                Showing results for "<strong>{searchTerm}</strong>"
                <button 
                  onClick={() => setSearchTerm("")}
                  className="ml-2 text-violet-600 hover:text-violet-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredApps.map((app, index) => {
              const statusConfig = getStatusConfig(app.status);
              const applicantInitials = getApplicantInitials(app.applicantName);
              const companyInitials = getCompanyInitials(app.jobCompany);
              const timeAgo = getTimeAgo(app.createdAt);
              
              return (
                <div
                  key={app.id}
                  className={`bg-gradient-to-br ${statusConfig.bgGradient} rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 group animate-fade-in-card`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <span className="text-white font-bold text-sm">{applicantInitials}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{app.applicantName || 'Unknown Applicant'}</h3>
                        <p className="text-sm text-gray-600">{app.applicantEmail || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                        <span className="mr-1">{statusConfig.icon}</span>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">{companyInitials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{app.jobTitle || 'No Job Title'}</h4>
                        <p className="text-sm text-gray-600 truncate">{app.jobCompany || 'Unknown Company'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="bg-white bg-opacity-60 px-2 py-1 rounded-full">
                        ID: {app.id}
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{timeAgo}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-violet-200 transition-all duration-300 pointer-events-none"></div>
                </div>
              );
            })}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No matching applications found" : "No applications found"}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? "Try adjusting your search terms or filters" 
                  : "There are no job applications to display at the moment."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
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
    position: relative;
  }
`}</style>
    </div>
  );
}