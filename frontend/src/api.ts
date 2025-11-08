// frontend/src/api.ts
import axios from 'axios';

// ✅ ADD VALIDATION - This will catch missing env during build
const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  // This will show up in browser console and build logs
  console.error('❌ VITE_API_BASE is missing! Check your Vercel environment variables.');
  console.error('Current import.meta.env:', import.meta.env);
  
  // Optional: Throw error to make it more visible
  throw new Error('VITE_API_BASE environment variable is required');
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 10000,
});

// ✅ Set token helper
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("jobportal_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("jobportal_token");
  }
}

// ✅ Load saved token on refresh
const saved = localStorage.getItem("adminToken");
if (saved) setAuthToken(saved);


// const api = axios.create({
//   baseURL: API_BASE,
//   withCredentials: true, // if needed
//   timeout: 10000, // ✅ Consider adding timeout
// });

// // Token management (this is perfect)
// export function setAuthToken(token: string | null) {
//   if (token) {
//     api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     localStorage.setItem('jobportal_token', token);
//   } else {
//     delete api.defaults.headers.common['Authorization'];
//     localStorage.removeItem('jobportal_token');
//   }
// }

// export { api }; // ✅ Make sure to export api