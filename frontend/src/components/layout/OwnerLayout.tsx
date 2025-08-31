
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import OwnerNavigation from '../OwnerNavigation';
import { UserRole } from '@/types/enums';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import './OwnerLayout.css';

interface OwnerLayoutProps {
  children: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
  isLoading?: boolean;
}

const OwnerLayout: React.FC<OwnerLayoutProps> = ({ 
  children, 
  className = '',
  showNavigation = true,
  isLoading = false
}) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();

  // Memoize computed values to prevent unnecessary re-renders
  const currentRoute = useMemo(() => location.pathname, [location.pathname]);
  const currentRole = useMemo(() => {
    return user?.role as UserRole || UserRole.OWNER;
  }, [user?.role]);

  // Handle navigation toggle for mobile responsiveness
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const toggleMobileNav = useCallback(() => {
    setIsMobileNavOpen(prev => !prev);
  }, []);
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [currentRoute]);

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="app-layout loading-state">
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  // Redirect or show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-layout error-state">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong with the layout</div>}>
      <div className={`app-layout ${className}`} data-testid="owner-layout">
        {/* Header Section */}
        <header className="header-container" role="banner">
          <Header 
            onMenuToggle={toggleMobileNav}
            isMobileNavOpen={isMobileNavOpen}
          />
        </header>

        {/* Main Layout Row */}
        <div className="layout-row">
          {/* Navigation Sidebar */}
          {showNavigation && (
            <aside 
              className={`navigation-container ${isMobileNavOpen ? 'mobile-open' : ''}`}
              role="navigation"
              aria-label="Main navigation"
            >
              <OwnerNavigation 
                currentRole={currentRole} 
                currentRoute={currentRoute}
                isMobileOpen={isMobileNavOpen}
                onMobileClose={() => setIsMobileNavOpen(false)}
              />
            </aside>
          )}

          {/* Main Content Area */}
          <main 
            className={`main-content ${!showNavigation ? 'full-width' : ''}`}
            role="main"
            aria-label="Main content"
          >
            {/* Loading Overlay */}
            {isLoading && (
              <div className="content-loading-overlay">
                <LoadingSpinner />
              </div>
            )}
            {/* Content Body */}
            <div className="content-body">
              <ErrorBoundary fallback={<div>Error loading page content</div>}>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileNavOpen && (
          <div 
            className="mobile-nav-overlay"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(OwnerLayout);