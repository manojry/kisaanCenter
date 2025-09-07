/**
 * Desktop navigation component
 * Horizontal navigation with role-based access
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Home, 
  Users, 
  Store, 
  Package, 
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Navigation item interface
interface NavItem {
  label: string;
  href: string;
  roles: string[];
}

// Main navigation items
const MAIN_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'FARMER', 'BUYER'],
  },
  {
    label: 'Dashboard',
    href: '/owner',
    roles: ['OWNER'],
  },
];

export function DesktopNav() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  // Filter navigation items based on user role
  const visibleNavItems = MAIN_NAV_ITEMS.filter(item => 
    user && item.roles.some(role => hasRole(role as any))
  );

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  if (!user) return null;

  return (
    <nav className="hidden md:flex items-center gap-6">
      {/* Main navigation */}
      <div className="flex items-center gap-1">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getUserInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}