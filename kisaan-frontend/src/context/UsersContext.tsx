import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/api';
import { usersApi } from '../services/api';

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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.getAll({});
      if (response.data) setUsers(response.data);
    } catch (e) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
  <UsersContext.Provider value={{ users, setUsers, isLoading, setIsLoading, fetchUsers, refreshUsers }}>
      {children}
    </UsersContext.Provider>
  );
};
