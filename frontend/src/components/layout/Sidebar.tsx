import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '@/types/enums';
import { Menu, X } from 'lucide-react';

interface SidebarProps {
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
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
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white shadow-sm border-r transition-all duration-300
      `}>
        {/* Toggle button for desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block absolute -right-3 top-8 bg-white border rounded-full p-1 shadow-md"
        >
          <Menu className="h-4 w-4" />
        </button>

        <nav className="mt-16 lg:mt-8">
          {getNavigationItems().map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                  isActive ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' : ''
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`text-xl ${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
