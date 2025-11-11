import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from '../api';

type Role = 'USER' | 'RECRUITER' | 'ADMIN';

export type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

type LoginPayload = { email: string; password: string };
type RegisterPayload = { email: string; password: string; name: string; role?: Role };

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'jobportal_token';
const USER_KEY = 'jobportal_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as User : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    async function rehydrate() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken === "dummy-admin") {
        console.log("Admin token detected, creating admin user object");
        
        // ✅ FIX: Create admin user object
        const adminEmail = localStorage.getItem("adminEmail") || "admin@jobrun.in";
        const adminUser: User = {
          id: 9999, // Admin ID
          email: adminEmail,
          name: "Admin User",
          role: "ADMIN"
        };
        
        setUser(adminUser);
        setToken(storedToken);
        setLoading(false);
        return;
      }
      
      try {
        setAuthToken(storedToken);
        const res = await api.get('/users/me');
        const u = res.data.user;
        setUser(u);
        setToken(storedToken);
      } catch (err) {
        console.warn('Auth rehydrate failed, clearing token', err);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    }
    rehydrate();
  }, []);

  const login = async ({ email, password }: LoginPayload) => {
    const res = await api.post('/users/login', { email, password });
    const t = res.data.token;
    const u = res.data.user;
    setToken(t);
    setUser(u);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setAuthToken(t);
  };

  const register = async ({ email, password, name, role }: RegisterPayload) => {
    await api.post('/users/register', { email, password, name, role });
    // Auto-login after registration
    await login({ email, password });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}