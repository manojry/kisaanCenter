import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types/enums'
import { Menu, X } from 'lucide-react'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  FileText,
  Settings,
  Wheat,
  DollarSign
} from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER]
  },
  {
    name: 'Shops',
    href: '/shops',
    icon: Building2,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER]
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER, UserRole.EMPLOYEE]
  },
  {
    name: 'Stock',
    href: '/stock',
    icon: Wheat,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER]
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: ShoppingCart,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: CreditCard,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER, UserRole.EMPLOYEE, UserRole.FARMER, UserRole.BUYER]
  },
  {
    name: 'Credits',
    href: '/credits',
    icon: DollarSign,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER, UserRole.EMPLOYEE, UserRole.BUYER]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: TrendingUp,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER]
  },
  {
    name: 'Audit',
    href: '/audit',
    icon: FileText,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER]
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: [UserRole.SUPERADMIN, UserRole.OWNER]
  }
]

const Sidebar: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (!user) return null

  const allowedNavigation = navigation.filter(item => 
    item.roles.includes(user.role)
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white shadow-sm border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <nav className="mt-16 lg:mt-8 px-4">
          <ul className="space-y-2">
            {allowedNavigation.map((item) => {
              const isActive = currentPath === item.href
              const Icon = item.icon
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'mr-3 h-5 w-5',
                        isActive
                          ? 'text-primary-700'
                          : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Role Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="text-sm font-medium text-gray-900">{user.username}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            {user.shop_id && (
              <p className="text-xs text-gray-500">Shop ID: {user.shop_id}</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar