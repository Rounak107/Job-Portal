// frontend/src/api.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  console.error("❌ Missing VITE_API_BASE env var");
  throw new Error("Missing VITE_API_BASE");
}

// === General API (used by normal auth system) ===
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// === ADMIN-ONLY API INSTANCE ===
export const adminApi = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// 🟢 Token Setters
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("jobportal_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("jobportal_token");
  }
}

export function setAdminToken(token: string | null) {
  if (token) {
    adminApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("admin_token", token);
  } else {
    delete adminApi.defaults.headers.common["Authorization"];
    localStorage.removeItem("admin_token");
  }
}

// ✅ Auto-load tokens at startup
const userToken = localStorage.getItem("jobportal_token");
const adminToken = localStorage.getItem("admin_token");

if (userToken) setAuthToken(userToken);
if (adminToken) setAdminToken(adminToken);




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