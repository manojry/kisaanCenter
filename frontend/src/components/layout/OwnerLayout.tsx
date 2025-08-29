import React from 'react';
import Header from './Header';
import Navigation from '../Navigation';
import { UserRole } from '@/types/enums';

interface OwnerLayoutProps {
  children: React.ReactNode;
  currentRole: string;
  currentRoute: string;
}

const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children, currentRole, currentRoute }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Navigation 
          currentRole={currentRole as UserRole} 
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