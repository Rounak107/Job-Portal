import { api } from '../api';

export const adminApi = {
  get: (url: string) => {
    const adminEmail = localStorage.getItem("adminEmail");
    return api.get(url, {
      headers: {
        'x-admin-email': adminEmail
      }
    });
  },
  
  post: (url: string, data?: any) => {
    const adminEmail = localStorage.getItem("adminEmail");
    return api.post(url, data, {
      headers: {
        'x-admin-email': adminEmail
      }
    });
  }
};