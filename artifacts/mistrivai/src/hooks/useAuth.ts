import { useState, useEffect, createContext, useContext } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'user' | 'mechanic' | 'admin';
  profile_pic: string | null;
  is_approved?: boolean | null;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

import React from 'react';
export const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => ({ success: false, message: '' }),
  logout: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await apiGet('/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data.logged_in ? data.user : null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string, role = 'user') => {
    const res = await apiPost('/login', { username: email, password, role });
    const data = await res.json();
    if (data.success) { setUser(data.user); }
    return { success: data.success, message: data.message };
  };

  const logout = async () => {
    await apiPost('/logout');
    setUser(null);
  };

  return React.createElement(AuthContext.Provider, { value: { user, loading, login, logout, refresh } }, children);
}
