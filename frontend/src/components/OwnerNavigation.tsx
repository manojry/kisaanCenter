import React from 'react';
import { Link } from 'react-router-dom';
import { UserRole } from '../types/enums';
import { useAuth } from '@/context/AuthContext';
import './OwnerNavigation.css';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles: UserRole[];
  badge?: string;
  urgent?: boolean;
}

const ownerNavigationItems: NavItem[] = [
  // Dashboard - Always first
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    route: '/dashboard',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  
  // Core business operations
  {
    id: 'transactions',
    label: 'Transactions',
    icon: '💰',
    route: '/transactions',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE],
    badge: 'Core'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: '💳',
    route: '/payments',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE],
    badge: 'Core'
  },
  {
    id: 'stock',
    label: 'Stock & Deliveries',
    icon: '📦',
    route: '/stock',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'users',
    label: 'Users',
    icon: '👥',
    route: '/users',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'products',
    label: 'Products',
    icon: '🌾',
    route: '/products',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'commissions',
    label: 'Commission Rules',
    icon: '💼',
    route: '/commissions',
    roles: [UserRole.OWNER]
  },
  {
    id: 'credits',
    label: 'Credits',
    icon: '🏦',
    route: '/credits',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '📈',
    route: '/reports',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: '📋',
    route: '/audit',
    roles: [UserRole.OWNER]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    route: '/settings',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    route: '/profile',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  }
];


interface OwnerNavigationProps {
  currentRole: UserRole;
  currentRoute: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}


export const OwnerNavigation: React.FC<OwnerNavigationProps> = ({ 
  currentRole, 
  currentRoute,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose
}) => {
  const { user } = useAuth();
  if (!user) return null;

  // Get filtered navigation items based on user role
  const visibleNavItems = ownerNavigationItems.filter(item => 
    item.roles.includes(currentRole)
  );

  const handleNavClick = () => {
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
  {/* Navigation Sidebar */}
  <nav className={`owner-navigation ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Navigation Header - no brand logo, just collapse button if present */}
        {onToggleCollapse && (
          <button 
            className="collapse-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        )}
        {/* Navigation Content */}
        <div className="nav-content">
          <div className="nav-section">
            <ul className="nav-list">
              {visibleNavItems.map(item => (
                <li key={item.id}>
                  <Link
                    to={item.route}
                    className={`nav-item ${currentRoute === item.route ? 'active' : ''} ${item.urgent ? 'urgent' : ''}`}
                    onClick={handleNavClick}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    <div className="nav-indicators">
                      {item.badge && (
                        <span className={`nav-badge ${item.badge.toLowerCase()}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Stats - Only for Owner */}
        {user.role === UserRole.OWNER && !isCollapsed && (
          <div className="nav-quick-stats">
            <div className="stats-header">
              <span className="stats-icon">📊</span>
              <span className="stats-title">Today's Overview</span>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">₹12.5K</span>
                <span className="stat-label">Revenue</span>
              </div>
              <div className="stat-item">
                <span className="stat-value urgent">5</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default OwnerNavigation;