// frontend/src/api.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
export const api = axios.create({ baseURL: API_BASE, timeout: 20000 });
export const adminApi = axios.create({ baseURL: API_BASE, timeout: 20000 });

// ---- USER token ----
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("jobportal_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("jobportal_token");
  }
}

// ---- ADMIN token ----
export function setAdminToken(token: string | null) {
  if (token) {
    adminApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("admin_token", token);
  } else {
    delete adminApi.defaults.headers.common["Authorization"];
    localStorage.removeItem("admin_token");
  }
}

// ---- Auto-load on startup ----
const admin = localStorage.getItem("admin_token");
const user = localStorage.getItem("jobportal_token");
if (admin) setAdminToken(admin);
else if (user) setAuthToken(user);





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