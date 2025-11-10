// // frontend/src/adminApi.ts
// import axios from 'axios';

// const API_BASE = import.meta.env.VITE_API_BASE;

// // Separate axios instance for admin
// export const adminApi = axios.create({
//   baseURL: API_BASE,
//   timeout: 10000,
// });

// // Admin-specific token management
// export function setAdminToken(token: string | null) {
//   if (token) {
//     adminApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//   } else {
//     delete adminApi.defaults.headers.common['Authorization'];
//   }
// }

// // Initialize with admin token if exists
// const savedAdminToken = localStorage.getItem("jobportal_token");
// if (savedAdminToken === "dummy-admin") {
//   setAdminToken("dummy-admin");
// }