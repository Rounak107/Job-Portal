// frontend/src/api.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  console.error('❌ VITE_API_BASE missing. Please set it in your .env or Vercel dashboard.');
  throw new Error('VITE_API_BASE environment variable is required.');
}

// Create global axios instance
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000, // allow longer cold-starts on Render
});

// ✅ Unified token setter
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jobportal_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('jobportal_token');
  }
}

// ✅ Always load saved token on refresh
const savedUser = localStorage.getItem("jobportal_token");
const savedAdmin = localStorage.getItem("admin_token");

if (savedAdmin) {
  api.defaults.headers.common["Authorization"] = `Bearer ${savedAdmin}`;
} else if (savedUser) {
  api.defaults.headers.common["Authorization"] = `Bearer ${savedUser}`;
}




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