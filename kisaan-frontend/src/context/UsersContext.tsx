import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/api';
import { usersApi } from '../services/api';
import { useAuth } from './AuthContext';

interface UsersContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUsers: () => Promise<void>;
  refreshUsers: () => Promise<void>;
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

  const fetchUsers = async () => {
    if (!isAuthenticated) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await usersApi.getAll({});
      if (response.data) setUsers(response.data);
    } catch {
      // handle error - user will see toast notification from apiClient
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    } else {
      setUsers([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  return (
  <UsersContext.Provider value={{ users, setUsers, isLoading, setIsLoading, fetchUsers, refreshUsers }}>
      {children}
    </UsersContext.Provider>
  );
};
