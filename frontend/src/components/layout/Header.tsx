import React from 'react'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { LogOut, User, Bell } from 'lucide-react'
import { UserRole } from '@/types/enums'

const Header: React.FC = () => {
  const { user, logout } = useAuth()

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER:
        return <span className="text-green-600">🌾</span>
      case UserRole.FARMER:
        return <span className="text-green-600">🌾</span>
      case UserRole.BUYER:
        return <span className="text-blue-600">🛒</span>
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPERADMIN:
        return 'bg-purple-100 text-purple-800'
      case UserRole.OWNER:
        return 'bg-blue-100 text-blue-800'
      case UserRole.EMPLOYEE:
        return 'bg-gray-100 text-gray-800'
      case UserRole.FARMER:
        return 'bg-green-100 text-green-800'
      case UserRole.BUYER:
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="brand-icon text-3xl">🌾</span>
            <span className="ml-2 text-xl font-bold text-gray-900">
              KisaanCenter
            </span>
            <span className="ml-2 text-xs text-gray-500 font-medium">AgriTech Platform</span>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.username}
                  </p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header