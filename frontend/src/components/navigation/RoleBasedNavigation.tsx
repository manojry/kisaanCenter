import React from 'react';
import { User } from '../../features/user/types';

interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  roles: string[];
  children?: NavigationItem[];
}

export const navigationConfig: NavigationItem[] = [
  // Dashboard - Available to all authenticated users
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    roles: ['SUPERADMIN', 'OWNER', 'EMPLOYEE', 'FARMER', 'BUYER']
  },
  
  // SuperAdmin Only
  {
    label: 'System Management',
    path: '/admin',
    icon: 'settings',
    roles: ['SUPERADMIN'],
    children: [
      { label: 'All Shops', path: '/admin/shops', roles: ['SUPERADMIN'] },
      { label: 'All Users', path: '/admin/users', roles: ['SUPERADMIN'] },
      { label: 'System Health', path: '/admin/health', roles: ['SUPERADMIN'] },
      { label: 'Audit Logs', path: '/admin/audit', roles: ['SUPERADMIN'] },
      { label: 'Reports', path: '/admin/reports', roles: ['SUPERADMIN'] }
    ]
  },
  
  // Owner & Employee
  {
    label: 'Shop Management',
    path: '/shop',
    icon: 'store',
    roles: ['OWNER', 'EMPLOYEE'],
    children: [
      { label: 'Shop Overview', path: '/shop/overview', roles: ['OWNER', 'EMPLOYEE'] },
      { label: 'Transactions', path: '/shop/transactions', roles: ['OWNER', 'EMPLOYEE'] },
      { label: 'Stock Management', path: '/shop/stock', roles: ['OWNER', 'EMPLOYEE'] },
      { label: 'Users', path: '/shop/users', roles: ['OWNER', 'EMPLOYEE'] },
      { label: 'Commission Rules', path: '/shop/commissions', roles: ['OWNER'] },
      { label: 'Payments', path: '/shop/payments', roles: ['OWNER', 'EMPLOYEE'] }
    ]
  },
  
  // Farmer Features
  {
    label: 'My Farm',
    path: '/farmer',
    icon: 'agriculture',
    roles: ['FARMER'],
    children: [
      { label: 'My Stock', path: '/farmer/stock', roles: ['FARMER'] },
      { label: 'My Sales', path: '/farmer/sales', roles: ['FARMER'] },
      { label: 'Earnings', path: '/farmer/earnings', roles: ['FARMER'] },
      { label: 'Stock Alerts', path: '/farmer/alerts', roles: ['FARMER'] }
    ]
  },
  
  // Buyer Features
  {
    label: 'My Purchases',
    path: '/buyer',
    icon: 'shopping_cart',
    roles: ['BUYER'],
    children: [
      { label: 'Purchase History', path: '/buyer/history', roles: ['BUYER'] },
      { label: 'Credit Status', path: '/buyer/credit', roles: ['BUYER'] },
      { label: 'Payments', path: '/buyer/payments', roles: ['BUYER'] }
    ]
  },
  
  // Common Features
  {
    label: 'Products',
    path: '/products',
    icon: 'inventory',
    roles: ['OWNER', 'EMPLOYEE', 'FARMER', 'BUYER']
  },
  
  // Profile - Available to all
  {
    label: 'Profile',
    path: '/profile',
    icon: 'person',
    roles: ['SUPERADMIN', 'OWNER', 'EMPLOYEE', 'FARMER', 'BUYER']
  }
];

interface RoleBasedNavigationProps {
  user: User;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  user,
  currentPath,
  onNavigate
}) => {
  const canAccessItem = (item: NavigationItem): boolean => {
    return item.roles.includes(user.role);
  };

  const renderNavigationItem = (item: NavigationItem): JSX.Element | null => {
    if (!canAccessItem(item)) return null;

    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
        <div 
          className="nav-link" 
          onClick={() => !hasChildren && onNavigate(item.path)}
        >
          {item.icon && <span className={`icon ${item.icon}`}></span>}
          <span className="label">{item.label}</span>
          {hasChildren && <span className="expand-icon">▼</span>}
        </div>
        
        {hasChildren && (
          <div className="nav-children">
            {item.children?.map(child => renderNavigationItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="role-based-navigation">
      <div className="nav-header">
        <h3>KisaanCenter</h3>
        <div className="user-info">
          <span className="username">{user.username}</span>
          <span className="role">{user.role}</span>
        </div>
      </div>
      
      <div className="nav-items">
        {navigationConfig.map(item => renderNavigationItem(item))}
      </div>
    </nav>
  );
};
