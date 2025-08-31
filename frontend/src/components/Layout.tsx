import React from 'react';
import { Navigation } from './Navigation';
import { UserRole } from '../types/enums';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout?: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentRole,
  currentRoute,
  onNavigate,
  onLogout,
  title,
  subtitle,
  actions
}) => {
  return (
    <div className="layout">
      <div className="app-layout">
        {/* Header row at the top */}
        { (title || subtitle || actions) && (
          <header className="app-header">
            <div className="header-text">
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && (
              <div className="header-actions">
                {actions}
              </div>
            )}
          </header>
        )}
        {/* Two columns below header: nav and main */}
        <div className="layout-row">
          <Navigation
            currentRole={currentRole}
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
          <main className="main-content">
            <div className="content-body">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
