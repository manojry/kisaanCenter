import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { usersApi } from '../services/api';
import type { User } from '../types/api';
import type { Dispatch, SetStateAction } from 'react';

type UsersContextType = {
  users: User[];
  setUsers: Dispatch<SetStateAction<User[]>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  total: number;

  setTotal: Dispatch<SetStateAction<number>>;
  allUsers: User[];
  refreshUsers: (force?: boolean) => Promise<void>;
  allUsersFetched: boolean;
};

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};


interface UsersProviderProps {
  children: React.ReactNode;
}

export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]); // filtered/paged users
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const backendTotal = useRef<number>(0);
  const [allUsersFetched, setAllUsersFetched] = useState(false);

  // Fetch all users (large limit, e.g. 1000)
  const refreshUsers = async (force = false) => {
    if (!isAuthenticated) {
      setAllUsers([]);
      setUsers([]);
      setIsLoading(false);
      setTotal(0);
      backendTotal.current = 0;
      return;
    }
    setIsLoading(true);
    try {
      // Only fetch if forced or on initial load
      if (force || allUsers.length === 0) {
    const limit = 100;
    const response = await usersApi.getAll({ page: 1, limit });
    setAllUsers(response.data || []);
    setTotal(response.total ?? (response.data?.length || 0));
    // Use normalized response.total, which is set from meta.total if present
    setAllUsersFetched((response.data?.length || 0) >= (response.total ?? (response.data?.length || 0)));
      }
    } catch {
      setAllUsers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter, paginate users on the frontend
  useEffect(() => {
    let filtered = allUsers;
    // Optionally, you can add more filters here (e.g., role, search) via context if needed
    setTotal(filtered.length);
    const start = (page - 1) * pageSize;
    setUsers(filtered.slice(start, start + pageSize));
  }, [allUsers, page, pageSize]);

  // Fetch all users on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      refreshUsers(true);
    } else {
      setAllUsers([]);
      setUsers([]);
      setIsLoading(false);
      setTotal(0);
      setAllUsersFetched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      allUsers,
      refreshUsers,
      allUsersFetched
    }}>
      {children}
    </UsersContext.Provider>
  );
};

export { UsersContext };
