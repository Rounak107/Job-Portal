// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { api } from "../../api";

// type ApplicationDetails = {
//   id: number;
//   jobId?: number | null;
//   jobTitle?: string;
//   jobCompany?: string;
//   applicantId?: number | null;
//   applicantName?: string;
//   applicantEmail?: string;
//   status: string;
//   createdAt: string;
//   // Add more fields as needed
// };

// export default function ApplicationDetailsPage() {
//   const { id } = useParams<{ id: string }>();
//   const [application, setApplication] = useState<ApplicationDetails | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!id) return;

//     const adminEmail = localStorage.getItem("adminEmail");
    
//     api
//       .get<ApplicationDetails>(`/admin/applications/${id}`, {
//         headers: {
//           'x-admin-email': adminEmail
//         }
//       })
//       .then((res: any) => setApplication(res.data))
//       .catch((err: any) => console.error("Failed to fetch application details", err))
//       .finally(() => setLoading(false));
//   }, [id]);

//   if (loading) {
//     return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading application details...</div>;
//   }

//   if (!application) {
//     return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Application not found</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-4xl mx-auto">
//         <div className="mb-4">
//           <Link to="/admin/applications" className="text-blue-600 hover:underline">
//             ← Back to Applications
//           </Link>
//         </div>
        
//         <div className="bg-white rounded-lg shadow p-6">
//           <h1 className="text-2xl font-bold mb-4">Application Details - ID: {application.id}</h1>
//           <div className="grid grid-cols-2 gap-4">
//             <div><strong>Application ID:</strong> {application.id}</div>
//             <div><strong>Status:</strong> 
//               <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
//                 application.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
//                 application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//                 application.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
//                 'bg-gray-100 text-gray-800'
//               }`}>
//                 {application.status}
//               </span>
//             </div>
//             <div><strong>Applicant:</strong> {application.applicantName || 'N/A'}</div>
//             <div><strong>Applicant Email:</strong> {application.applicantEmail || 'N/A'}</div>
//             <div><strong>Job Title:</strong> {application.jobTitle || 'N/A'}</div>
//             <div><strong>Company:</strong> {application.jobCompany || 'N/A'}</div>
//             <div><strong>Applied On:</strong> {new Date(application.createdAt).toLocaleDateString()}</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }