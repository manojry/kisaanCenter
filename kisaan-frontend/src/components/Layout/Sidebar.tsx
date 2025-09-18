import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign, 
  FileText, 
  Settings,
  BarChart3,
  Building2,
  Tags,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { Button } from '../ui/button';

const ownerNavigation = [
  { name: 'Dashboard', href: '/owner', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: ShoppingCart },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Payments', href: '/payments', icon: DollarSign },
  { name: 'Balance', href: '/balance', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settlements', href: '/settlements', icon: BarChart3 },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const superadminNavigation = [
  { name: 'Dashboard', href: '/superadmin', icon: Home },
  { name: 'Shops', href: '/superadmin/shops', icon: Building2 },
  { name: 'Users', href: '/superadmin/users', icon: Users },
  { name: 'Categories', href: '/superadmin/categories', icon: Tags },
  { name: 'Assign Products', href: '/superadmin/shop-products', icon: LinkIcon },
  { name: 'Reports', href: '/superadmin/reports', icon: FileText },
  { name: 'Products', href: '/superadmin/products', icon: Package },
  { name: 'Settings', href: '/superadmin/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  
  const navigation = user?.role === 'superadmin' ? superadminNavigation : ownerNavigation;

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex h-full flex-col bg-white border-r border-gray-200 transition-all duration-300 z-40",
        "fixed inset-y-0 left-0 top-16",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Toggle button for desktop */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex absolute -right-3 top-4 h-6 w-6 rounded-full border bg-white shadow-md"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                    !isCollapsed && 'mr-3'
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}