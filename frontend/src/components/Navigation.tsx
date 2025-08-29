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
}

const navigationItems: NavItem[] = [
  // Dashboard
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    route: '/dashboard',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  // Shop Management (Owner & Employee)
  {
    id: 'shop-overview',
    label: 'Shop Overview',
    icon: '🏪',
    route: '/shop/overview',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'shop-transactions',
    label: 'Transactions',
    icon: '�',
    route: '/shop/transactions',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'shop-stock',
    label: 'Stock Management',
    icon: '📋',
    route: '/shop/stock',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'shop-users',
    label: 'Users',
    icon: '�',
    route: '/shop/users',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    id: 'shop-commissions',
    label: 'Commission Rules',
    icon: '💼',
    route: '/shop/commissions',
    roles: [UserRole.OWNER]
  },
  {
    id: 'shop-payments',
    label: 'Payments',
    icon: '💳',
    route: '/shop/payments',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  // Products
  {
    id: 'products',
    label: 'Products',
    icon: '📦',
    route: '/products',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  // Transactions (for all roles)
  {
    id: 'transactions',
    label: 'Transactions',
    icon: '�',
    route: '/transactions',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  // Users (for owner/employee)
  {
    id: 'users',
    label: 'Users',
    icon: '�',
    route: '/users',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  // Reports
  {
    id: 'reports',
    label: 'Reports',
    icon: '�',
    route: '/reports',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE]
  },
  // Settings
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    route: '/settings',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  // Profile (all roles)
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    route: '/profile',
    roles: [UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  }
];

interface NavigationProps {
  currentRole: UserRole;
  currentRoute: string;
}

export const Navigation: React.FC<NavigationProps> = ({ currentRole, currentRoute }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  
  if (!user) return null;

  // Get filtered navigation items based on user role
  const visibleNavItems = navigationItems.filter(item => 
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
                className={`nav-item ${currentRoute === item.route ? 'active' : ''}`}
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

        {/* User Info & Actions */}
        <div className="nav-footer">
          <div className="user-info">
            <div className="user-avatar">

              {user.role === UserRole.OWNER && '🏪'}
              {user.role === UserRole.EMPLOYEE && '👨‍💼'}
              {user.role === UserRole.FARMER && '👨‍🌾'}
              {user.role === UserRole.BUYER && '🛒'}
            </div>
            {!isCompact && (
              <div className="user-details">
                <span className="user-role">{user.role.toLowerCase()}</span>
                <span className="user-name">{user.username}</span>
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

export default Navigation;
