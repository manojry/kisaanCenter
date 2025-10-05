import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/api';
import { usersApi } from '../services/api';
import { useAuth } from './AuthContext';

interface UsersContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  refreshUsers: (page?: number, limit?: number) => Promise<void>;
  total: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchUsers = async (pageArg?: number, limitArg?: number) => {
    if (!isAuthenticated) {
      setUsers([]);
      setIsLoading(false);
      setTotal(0);
      return;
    }
    setIsLoading(true);
    try {
      const response = await usersApi.getAll({ page: pageArg || page, limit: limitArg || pageSize });
      // response is PaginatedResponse<User> with { data, total, page, limit, totalPages }
      setUsers(response.data || []);
      setTotal(response.total || 0);
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async (pageArg?: number, limitArg?: number) => {
    await fetchUsers(pageArg, limitArg);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    } else {
      setUsers([]);
      setIsLoading(false);
      setTotal(0);
    }
  }, [isAuthenticated, page, pageSize]);

  return (
  <UsersContext.Provider value={{ users, setUsers, isLoading, setIsLoading, fetchUsers, refreshUsers, total, page, setPage, pageSize, setPageSize }}>
      {children}
    </UsersContext.Provider>
  );
};
