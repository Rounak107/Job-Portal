// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { api } from "../../api"; // Adjust path based on your structure

// type RecruiterDetails = {
//   id: number;
//   name: string;
//   email: string;
//   createdAt: string;
//   jobCount: number;
//   applicationsCount: number;
//   applicationsByStatus: Record<string, number>;
// };

// export default function RecruiterDetailsPage() {
//   const { id } = useParams<{ id: string }>();
//   const [recruiter, setRecruiter] = useState<RecruiterDetails | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!id) return;

//     const adminEmail = localStorage.getItem("adminEmail");
    
//     api
//       .get<RecruiterDetails>(`/admin/recruiters/${id}`, {
//         headers: {
//           'x-admin-email': adminEmail
//         }
//       })
//       .then((res: any) => setRecruiter(res.data))
//       .catch((err: any) => console.error("Failed to fetch recruiter details", err))
//       .finally(() => setLoading(false));
//   }, [id]);

//   if (loading) {
//     return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading recruiter details...</div>;
//   }

//   if (!recruiter) {
//     return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Recruiter not found</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-4xl mx-auto">
//         <div className="mb-4">
//           <Link to="/admin/recruiters" className="text-blue-600 hover:underline">
//             ← Back to Recruiters
//           </Link>
//         </div>
        
//         <div className="bg-white rounded-lg shadow p-6">
//           <h1 className="text-2xl font-bold mb-4">Recruiter Details - {recruiter.name}</h1>
//           <div className="grid grid-cols-2 gap-4">
//             <div><strong>ID:</strong> {recruiter.id}</div>
//             <div><strong>Name:</strong> {recruiter.name}</div>
//             <div><strong>Email:</strong> {recruiter.email}</div>
//             <div><strong>Jobs Posted:</strong> {recruiter.jobCount}</div>
//             <div><strong>Total Applications:</strong> {recruiter.applicationsCount}</div>
//             <div><strong>Member Since:</strong> {new Date(recruiter.createdAt).toLocaleDateString()}</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }