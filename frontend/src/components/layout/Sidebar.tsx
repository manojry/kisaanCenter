import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '@/types/enums';

interface SidebarProps {
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    ];

    switch (userRole) {
      case UserRole.SUPERADMIN:
        return [
          ...baseItems,
          { path: '/users', label: 'User Management', icon: '👥' },
          { path: '/shops', label: 'Shop Management', icon: '🏪' },
          { path: '/plans', label: 'Plan Management', icon: '📋' },
          { path: '/audit', label: 'Audit Logs', icon: '📝' },
        ];
      case UserRole.OWNER:
        return [
          ...baseItems,
          { path: '/transactions', label: 'Transactions', icon: '💳' },
          { path: '/farmers', label: 'Farmers', icon: '🌾' },
          { path: '/buyers', label: 'Buyers', icon: '🛒' },
          { path: '/reports', label: 'Reports', icon: '📈' },
          { path: '/settings', label: 'Settings', icon: '⚙️' },
        ];
      case UserRole.EMPLOYEE:
        return [
          ...baseItems,
          { path: '/transactions', label: 'Transactions', icon: '💳' },
          { path: '/farmers', label: 'Farmers', icon: '🌾' },
          { path: '/buyers', label: 'Buyers', icon: '🛒' },
        ];
      default:
        return baseItems;
    }
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r">
      <nav className="mt-8">
        {getNavigationItems().map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                isActive ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' : ''
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
