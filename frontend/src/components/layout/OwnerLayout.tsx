import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import OwnerNavigation from '../OwnerNavigation';
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
    <div className="app-layout" style={{height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
      <div style={{position: 'sticky', top: 0, zIndex: 100, background: '#fff'}}>
        <Header />
      </div>
      <div className="layout-row" style={{flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, height: '100%'}}>
        <OwnerNavigation 
          currentRole={currentRole} 
          currentRoute={currentRoute} 
        />
        <main className="main-content" style={{flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', height: '100%'}}>
          <div className="content-body" style={{flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0}}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;