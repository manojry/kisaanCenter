/**
 * Main application layout component
 * Mobile-first responsive design with role-based navigation
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

import Header from './Header';
import { Sidebar } from './Sidebar';
import { Leaf } from 'lucide-react';

interface AppLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const showSidebar = user?.role === 'owner' || user?.role === 'superadmin';

  return (
    <div className={"min-h-screen bg-background font-sans antialiased" + (className ? ` ${className}` : "") }>
      <div className="relative flex min-h-screen">
        {/* Header - Full width */}
        <div className="fixed top-0 left-0 right-0 z-30">
          <Header />
        </div>
        
        {/* Sidebar for owners and superadmins */}
        {showSidebar && (
          <div className="flex flex-shrink-0 fixed left-0 top-16 bottom-0 z-50">
            <Sidebar />
          </div>
        )}
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Main content with padding for fixed header and sidebar */}
          <main className={`flex-1 bg-gray-50 pt-16 transition-all duration-300 ${
            showSidebar ? (isCollapsed ? 'md:pl-16' : 'md:pl-64') : ''
          }`}>
            {children ?? <Outlet />}
          </main>

          {/* Footer */}
          <footer className={`border-t border-gray-200 bg-white transition-all duration-300 ${
            showSidebar ? (isCollapsed ? 'md:pl-16' : 'md:pl-64') : ''
          }`}>
            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    © 2024 KisaanCenter. All rights reserved.
                  </span>
                </div>
                
                {user && (
                  <div className="text-sm text-gray-600">
                    Welcome back, {user.username}
                  </div>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;