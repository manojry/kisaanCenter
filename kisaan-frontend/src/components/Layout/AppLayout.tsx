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
  readonly children?: React.ReactNode;
  readonly className?: string;
}

export function AppLayout({ children, className }: Readonly<AppLayoutProps>) {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const showSidebar = user?.role === 'owner' || user?.role === 'superadmin';

  // Extract sidebar padding class from nested ternary
  const sidebarPaddingClass = showSidebar
    ? isCollapsed
      ? 'md:pl-16'
      : 'md:pl-64'
    : '';

  // Extract main content to avoid nested ternary in JSX
  const mainContent = children ? children : <Outlet />;

  // Extract footer padding class from nested ternary
  const footerPaddingClass = showSidebar
    ? isCollapsed
      ? 'md:pl-16'
      : 'md:pl-64'
    : '';

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
          <main className={`flex-1 bg-gradient-to-br from-background via-background to-muted/20 pt-16 transition-all duration-300 ${sidebarPaddingClass}`}>
            <div className="min-h-full">
              {mainContent}
            </div>
          </main>

          {/* Enhanced Footer */}
          <footer className={`border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${footerPaddingClass}`}>
            <div className="px-6 py-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 max-w-7xl mx-auto">
                {/* Footer branding */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Leaf className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-foreground/80">
                      KisaanCenter
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    © 2025 Agricultural Management Platform. All rights reserved.
                  </div>
                </div>
                
                {/* Footer status and info */}
                <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
                  {user && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span>System Active</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <a href="#" className="hover:text-foreground transition-colors">
                      Support
                    </a>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Privacy
                    </a>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Terms
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;