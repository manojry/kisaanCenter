import React from 'react';
import Header from './Header';
import Navigation from '../Navigation';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 min-w-0 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;