import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/api';

interface UsersContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
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

  const refreshUsers = async () => {
    setIsLoading(true);
    try {
      // You may want to add params here if needed
      const response = await import('../services/api').then(m => m.usersApi.getAll({}));
      if (response.data) setUsers(response.data);
    } catch (e) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <UsersContext.Provider value={{ users, setUsers, isLoading, setIsLoading, refreshUsers }}>
      {children}
    </UsersContext.Provider>
  );
};
