import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/api';
import { usersApi } from '../services/api';
import { useAuth } from './AuthContext';

interface UsersContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  setTotal: React.Dispatch<React.SetStateAction<number>>;
  refreshUsers: (page?: number, pageSize?: number, filters?: Record<string, unknown>) => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) throw new Error('useUsers must be used within a UsersProvider');
  return context;
};

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Always fetch all users (limit=300) for global cache
  const refreshUsers = async () => {
    if (!isAuthenticated) {
      setUsers([]);
      setIsLoading(false);
      setTotal(0);
      return;
    }
    setIsLoading(true);
    try {
  const response = await usersApi.getAll({ page: 1, limit: 100 });
      setUsers(response.data || []);
      setTotal(response.total ?? 0);
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshUsers();
    } else {
      setUsers([]);
      setIsLoading(false);
      setTotal(0);
    }

  }, [isAuthenticated]);

  return (
    <UsersContext.Provider value={{
      users,
      setUsers,
      isLoading,
      setIsLoading,
      page,
      setPage,
      pageSize,
      setPageSize,
      total,
      setTotal,
      refreshUsers
    }}>
      {children}
    </UsersContext.Provider>
  );
};
