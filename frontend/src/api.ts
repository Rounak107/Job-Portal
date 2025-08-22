// frontend/src/api.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'; 

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
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
