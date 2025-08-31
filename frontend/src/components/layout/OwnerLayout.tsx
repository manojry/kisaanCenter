
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import OwnerNavigation from '../OwnerNavigation';
import { UserRole } from '@/types/enums';
import ErrorBoundary from '../common/ErrorBoundary';
import LoadingSpinner from '../common/LoadingSpinner';
import './OwnerLayout.css';

/**
 * Props for the OwnerLayout component
 * @interface OwnerLayoutProps
 */
interface OwnerLayoutProps {
  /** Child components to render in the main content area */
  children: React.ReactNode;
  /** Additional CSS classes to apply to the layout container */
  className?: string;
  /** Whether to show the navigation sidebar */
  showNavigation?: boolean;
  /** Whether the layout is in a loading state */
  isLoading?: boolean;
  /** Optional test ID for testing purposes */
  testId?: string;
}

/**
 * OwnerLayout Component
 * 
 * A responsive layout component for the owner role with the following features:
 * - Mobile-first responsive design with navigation sidebar
 * - Authentication state management and protection
 * - Loading states for both auth and content
 * - Error boundary protection for reliability
 * - Accessibility support with proper ARIA labels
 * - Role-based navigation and access control
 * 
 * @param props - The component props
 * @returns A layout wrapper with header, navigation, and main content area
 */
const OwnerLayout: React.FC<OwnerLayoutProps> = ({ 
  children, 
  className = '',
  showNavigation = true,
  isLoading = false,
  testId = 'owner-layout'
}) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();

  // Memoize computed values to prevent unnecessary re-renders
  const currentRoute = useMemo(() => location.pathname, [location.pathname]);
  const currentRole = useMemo(() => {
    return user?.role as UserRole || UserRole.OWNER;
  }, [user?.role]);

  // Handle navigation toggle for mobile responsiveness with proper cleanup
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const toggleMobileNav = useCallback(() => {
    setIsMobileNavOpen(prev => !prev);
  }, []);

  // Close mobile nav on route changes for better UX
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [currentRoute]);

  // Handle escape key to close mobile navigation
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };

    if (isMobileNavOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when mobile nav is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'auto';
    };
  }, [isMobileNavOpen]);

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="app-layout loading-state" data-testid={`${testId}-loading`}>
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  // Redirect or show error if not authenticated with better error messaging
  if (!isAuthenticated) {
    return (
      <div className="app-layout error-state" data-testid={`${testId}-error`}>
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>Please log in to access this page.</p>
          <p>If you're having trouble, please contact support or try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={
      <div className="layout-error-fallback">
        <h2>Layout Error</h2>
        <p>Something went wrong with the layout. Please refresh the page.</p>
      </div>
    }>
      <div className={`app-layout ${className}`} data-testid={testId}>
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
              aria-expanded={isMobileNavOpen}
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
            aria-live={isLoading ? 'polite' : 'off'}
          >
            {/* Loading Overlay with improved accessibility */}
            {isLoading && (
              <div className="content-loading-overlay" aria-label="Loading content">
                <LoadingSpinner message="Loading..." />
              </div>
            )}
            
            {/* Content Body */}
            <div className="content-body">
              <ErrorBoundary fallback={
                <div className="content-error-fallback">
                  <h3>Content Error</h3>
                  <p>Error loading page content. Please try again.</p>
                </div>
              }>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>

        {/* Mobile Navigation Overlay with improved accessibility */}
        {isMobileNavOpen && (
          <div 
            className="mobile-nav-overlay"
            onClick={() => setIsMobileNavOpen(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsMobileNavOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close navigation"
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

// Export with display name for better debugging
OwnerLayout.displayName = 'OwnerLayout';

export default React.memo(OwnerLayout);