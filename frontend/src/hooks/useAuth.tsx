'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest } from '../lib/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load auth info from localStorage on mount
    const storedToken = localStorage.getItem('smarterp_token');
    const storedUserStr = localStorage.getItem('smarterp_user');

    if (storedToken && storedUserStr) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUserStr));
      } catch (e) {
        // Corrupted, clean up
        localStorage.removeItem('smarterp_token');
        localStorage.removeItem('smarterp_user');
      }
    }
    setLoading(false);
  }, []);

  // Handle route protection
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!token && !isPublicRoute) {
      router.push('/login');
    } else if (token && isPublicRoute) {
      router.push('/dashboard');
    }
  }, [token, pathname, loading, router]);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('smarterp_token', data.token);
      localStorage.setItem('smarterp_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      // Register successful, route to login
      router.push('/login');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('smarterp_token');
    localStorage.removeItem('smarterp_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
