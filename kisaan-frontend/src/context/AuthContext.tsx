import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/api';
import { authApi } from '../services/api';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hasRole: (role: string | string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh user data on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && !user) {
      refreshUser();
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      try {
        const data = await authApi.login({ username, password });
        if (data.token && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          if (data.user.role === 'owner') {
            window.location.href = '/owner';
          } else if (data.user.role === 'superadmin') {
            window.location.href = '/superadmin';
          }
        } else {
          setError('Invalid response format');
          setIsAuthenticated(false);
        }
      } catch (err: any) {
        setError(err.message || 'Login failed');
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getCurrentUser();
      if (res.data) {
        setUser(res.data);
        setIsAuthenticated(true);
        localStorage.setItem('auth_user', JSON.stringify(res.data));
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  const clearError = () => setError(null);

  const hasRole = (role: string | string[]) => {
    if (!user?.role) return false;
    const userRole = user.role.toLowerCase();
    if (Array.isArray(role)) {
      return role.map(r => r.toLowerCase()).includes(userRole);
    }
    return userRole === role.toLowerCase();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      error, 
      login, 
      logout, 
      clearError, 
      hasRole,
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
