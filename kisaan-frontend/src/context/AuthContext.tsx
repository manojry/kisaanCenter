// Adapted AuthContext for backend API (not Supabase)
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../model/swagger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // On load, restore user and token from localStorage
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || data?.error || 'Invalid credentials');
        setIsAuthenticated(false);
        return;
      }
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      // Redirect owners to their dashboard immediately
      if (data.user.role === 'owner') {
        window.location.href = '/owner';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const clearError = () => setError(null);

  // Case-insensitive, supports single role or array of roles
  const hasRole = (role: string | string[]) => {
    if (!user?.role) return false;
    const userRole = user.role.toUpperCase();
    if (Array.isArray(role)) {
      return role.map(r => r.toUpperCase()).includes(userRole);
    }
    return userRole === role.toUpperCase();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, error, login, logout, clearError, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
