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
  LogOut,
  Plus,
  Receipt
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
    roles: ['SUPERADMIN', 'EMPLOYEE', 'FARMER', 'BUYER'],
  },
  {
    label: 'Dashboard',
    href: '/owner',
    icon: Home,
    roles: ['OWNER'],
  },
  {
    label: 'Sales',
    href: '/new-transaction',
    icon: ShoppingCart,
    roles: ['OWNER', 'EMPLOYEE'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['OWNER', 'SUPERADMIN'],
  },
  {
    label: 'Products',
    href: '/products',
    icon: Package,
    roles: ['OWNER', 'EMPLOYEE'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['OWNER', 'SUPERADMIN'],
  },
  {
    label: 'Settlements',
    href: '/settlements',
    icon: Receipt,
    roles: ['OWNER'],
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
  <Button variant="ghost" size="icon" className="block sm:block md:hidden lg:hidden xl:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
  <SheetContent side="left" className="w-80 p-0">
  <div className="flex flex-col h-full relative p-1">
          {/* Header */}
          <div className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary p-2 rounded-lg">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                KisaanCenter
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {user.username} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </p>
          </div>

          {/* Navigation - scrollable */}
          <nav className="flex-1 overflow-y-auto pb-20">
            <div className="space-y-0.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href === '/owner' && location.pathname.startsWith('/owner'));

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Quick Actions Section */}
            {user?.role === 'owner' && (
              <div className="mt-3 pt-2 border-t border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Quick Actions
                </h3>
                <div className="space-y-0.5">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setIsOpen(false);
                            window.location.href = '/new-transaction';
                          }}
                          className="w-full flex items-center justify-center h-10 rounded-md border-2 border-dashed border-primary text-primary font-semibold text-base hover:bg-primary/10 transition"
                          title="Record Sale"
                        >
                          <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                          Record Sale
                        </Button>
                </div>
              </div>
            )}
          </nav>

          {/* Footer - pinned to bottom, taller for touch */}
          <div className="absolute left-0 right-0 bottom-0 p-2 border-t border-border bg-muted/30 h-14 flex items-center">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 h-auto py-3"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}