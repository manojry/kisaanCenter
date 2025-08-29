import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import Navigation from '../Navigation';
import { UserRole } from '@/types/enums';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Get current route from location
  const currentRoute = location.pathname;
  
  // Get current role from auth context, default to OWNER if not available
  const currentRole = user?.role as UserRole || UserRole.OWNER;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Navigation 
          currentRole={currentRole} 
          currentRoute={currentRoute} 
        />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;