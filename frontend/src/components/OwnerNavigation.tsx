import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '../types/enums';
import './Navigation.css';

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
  
  // OWNER PRIORITY WORKFLOW - Three-Party Management
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
  
  // USER MANAGEMENT
  {
    id: 'users',
    label: 'Users',
    icon: '👥',
    route: '/users',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  
  // BUSINESS MANAGEMENT
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
  
  // ANALYTICS & REPORTS
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
  
  // FARMER-SPECIFIC VIEWS
  {
    id: 'farmer-stock',
    label: 'My Deliveries',
    icon: '🚚',
    route: '/farmer/stock',
    roles: [UserRole.FARMER]
  },
  {
    id: 'farmer-payments',
    label: 'My Payments',
    icon: '💰',
    route: '/farmer/payments',
    roles: [UserRole.FARMER]
  },
  
  // BUYER-SPECIFIC VIEWS
  {
    id: 'buyer-purchases',
    label: 'My Purchases',
    icon: '🛒',
    route: '/buyer/purchases',
    roles: [UserRole.BUYER]
  },
  {
    id: 'buyer-credits',
    label: 'My Credits',
    icon: '💳',
    route: '/buyer/credits',
    roles: [UserRole.BUYER]
  },
  
  // SYSTEM
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
}

export const OwnerNavigation: React.FC<OwnerNavigationProps> = ({ currentRole, currentRoute }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);

  if (!user) return null;

  // Get filtered navigation items based on user role
  const visibleNavItems = ownerNavigationItems.filter(item => 
    item.roles.includes(currentRole)
  );

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentRoute]);

  // Toggle compact mode on medium screens
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Floating Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation"
      >
        <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-nav-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={`navigation ${isMobileMenuOpen ? 'mobile-open' : ''} ${isCompact ? 'compact' : ''}`}>
        {/* Desktop Brand */}
        <div className="nav-brand">
          <div className="brand-logo">🌾</div>
          {!isCompact && <h2>KisaanCenter</h2>}
        </div>

        {/* Navigation Items */}
        <ul className="nav-items">
          {visibleNavItems.map(item => (
            <li key={item.id}>
              <Link
                to={item.route}
                className={`nav-item ${currentRoute === item.route ? 'active' : ''} ${item.urgent ? 'urgent' : ''}`}
                onClick={handleNavClick}
                title={isCompact ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCompact && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Owner Quick Stats - Only for Owner */}
        {user.role === UserRole.OWNER && !isCompact && (
          <div className="nav-quick-stats">
            <div className="quick-stat">
              <span className="stat-label">Today's Revenue</span>
              <span className="stat-value">₹12,500</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">Pending Actions</span>
              <span className="stat-value urgent">5</span>
            </div>
          </div>
        )}

        {/* User Info & Actions */}
        <div className="nav-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user.role === UserRole.OWNER && '🏪'}
              {user.role === UserRole.EMPLOYEE && '👨💼'}
              {user.role === UserRole.FARMER && '👨🌾'}
              {user.role === UserRole.BUYER && '🛒'}
            </div>
            {!isCompact && (
              <div className="user-details">
                <span className="user-role">{user.role.toLowerCase()}</span>
                <span className="user-name">{user.username}</span>
                {user.role === UserRole.OWNER && (
                  <span className="user-shop">Shop Owner</span>
                )}
              </div>
            )}
          </div>
          
          <button
            className="nav-item logout-btn"
            onClick={logout}
            title={isCompact ? 'Logout' : undefined}
          >
            <span className="nav-icon">🚪</span>
            {!isCompact && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </nav>
    </>
  );
};

export default OwnerNavigation;