// frontend/src/api.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // if needed
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jobportal_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('jobportal_token');
  }
}
