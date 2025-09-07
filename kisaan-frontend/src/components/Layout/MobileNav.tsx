/**
 * Mobile-first navigation component
 * Role-based navigation with responsive design
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { 
  Menu, 
  Home, 
  Users, 
  Store, 
  Package, 
  CreditCard,
  BarChart3,
  Settings,
  Leaf,
  ShoppingCart,
  Truck,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Navigation item interface
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

// Navigation items configuration
const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['SUPERADMIN', 'OWNER', 'EMPLOYEE', 'FARMER', 'BUYER'],
  },
  {
    label: 'Shops',
    href: '/shops',
    icon: Store,
    roles: ['SUPERADMIN', 'OWNER'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['SUPERADMIN', 'OWNER', 'EMPLOYEE'],
  },
  {
    label: 'Products',
    href: '/products',
    icon: Package,
    roles: ['OWNER', 'EMPLOYEE', 'FARMER', 'BUYER'],
  },
  {
    label: 'Stock',
    href: '/stock',
    icon: Leaf,
    roles: ['OWNER', 'EMPLOYEE', 'FARMER'],
  },
  {
    label: 'Transactions',
    href: '/transactions',
    icon: CreditCard,
    roles: ['OWNER', 'EMPLOYEE', 'FARMER', 'BUYER'],
  },
  {
    label: 'Purchases',
    href: '/purchases',
    icon: ShoppingCart,
    roles: ['BUYER'],
  },
  {
    label: 'Sales',
    href: '/sales',
    icon: Truck,
    roles: ['FARMER'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['SUPERADMIN', 'OWNER'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['SUPERADMIN', 'OWNER', 'EMPLOYEE', 'FARMER', 'BUYER'],
  },
];

export function MobileNav() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Filter navigation items based on user role
  const visibleNavItems = NAV_ITEMS.filter(item => 
    user && item.roles.some(role => hasRole(role as any))
  );

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              KisaanCenter
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.username} • {user.role}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}