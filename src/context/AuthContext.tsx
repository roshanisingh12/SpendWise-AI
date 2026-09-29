import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiService } from '../services/api';

export type User = {
  id: string;
  name: string;
  email: string;
  preferredCurrency?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, preferredCurrency?: string) => Promise<void>;
  updateUser: (data: { name?: string; email?: string; preferredCurrency?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('spendwise-token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMe = async () => {
    if (!token) return;
    try {
      const data = await ApiService.getMe();
      setUser(data.user);
    } catch (err) {
      // token likely invalid/expired
      localStorage.removeItem('spendwise-token');
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const result = await ApiService.login({ email, password });
    const newToken = result.token;
    if (newToken) {
      localStorage.setItem('spendwise-token', newToken);
      setToken(newToken);
      await fetchMe();
    }
  };

  const register = async (name: string, email: string, password: string, preferredCurrency?: string) => {
    const result = await ApiService.register({ name, email, password, preferredCurrency: preferredCurrency || 'INR' });
    const newToken = result.token;
    if (newToken) {
      localStorage.setItem('spendwise-token', newToken);
      setToken(newToken);
      await fetchMe();
    }
  };

  const updateUser = async (data: { name?: string; email?: string; preferredCurrency?: string }) => {
    const res = await ApiService.updateUser(data);
    if (res?.user) {
      setUser(res.user);
    } else {
      await fetchMe();
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (_) {}
    localStorage.removeItem('spendwise-token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
