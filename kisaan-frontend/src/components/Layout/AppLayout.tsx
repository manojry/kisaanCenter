/**
 * Main application layout component
 * Mobile-first responsive design with role-based navigation
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import Header from './Header';
import { Leaf } from 'lucide-react';

interface AppLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const { user } = useAuth();

  return (
  <div className={"min-h-screen bg-background font-sans antialiased" + (className ? ` ${className}` : "") }>
      <div className="relative flex min-h-screen flex-col">
  {/* Header */}
  <Header />

        {/* Main content */}
        <main className="flex-1">
          {children ?? <Outlet />}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/50">
          <div className="container px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary-emerald" />
                <span className="text-sm text-muted-foreground">
                  © 2024 KisaanCenter. All rights reserved.
                </span>
              </div>
              
              {user && (
                <div className="text-sm text-muted-foreground">
                  Welcome back, {user.username}
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;