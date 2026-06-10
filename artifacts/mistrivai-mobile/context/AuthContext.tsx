import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiGet, apiPost, clearSessionCookie } from "@/lib/api";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "user" | "mechanic" | "admin";
  profile_pic: string | null;
  is_approved?: boolean | null;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    role?: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => ({ success: false, message: "" }),
  logout: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const USER_CACHE_KEY = "mv_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await apiGet("/profile");
      if (res.ok) {
        const data = await res.json();
        const u: AuthUser | null = data.logged_in ? data.user : null;
        setUser(u);
        if (u) {
          await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
        } else {
          await AsyncStorage.removeItem(USER_CACHE_KEY);
        }
      }
    } catch {
      const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
      if (cached) setUser(JSON.parse(cached));
      else setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string, role = "user") => {
    const res = await apiPost("/login", { username: email, password, role });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
    }
    return { success: data.success, message: data.message };
  };

  const logout = async () => {
    try {
      await apiPost("/logout");
    } catch {}
    setUser(null);
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    await clearSessionCookie();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
