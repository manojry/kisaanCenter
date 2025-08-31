import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { Bell, LogOut } from 'lucide-react'
import { UserRole } from '@/types/enums'
import './Header.css'


interface HeaderProps {
  onMenuToggle?: () => void;
  isMobileNavOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMobileNavOpen }) => {
  const { user, logout } = useAuth()


  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            {onMenuToggle && (
              <button
                className="md:hidden mr-2 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100"
                aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
                onClick={onMenuToggle}
              >
                <span className="sr-only">Toggle navigation</span>
                {/* Hamburger icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block md:hidden">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            <span className="brand-icon text-3xl">🌾</span>
            <span className="ml-2 text-xl font-bold text-gray-900">
              KisaanCenter
            </span>
            <span className="ml-2 text-xs text-gray-500 font-medium">AgriTech Platform</span>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-3 header-user-profile">
                {/* User Profile - Similar to sidebar style */}
                <div className="flex items-center space-x-2">
                  <div className="user-avatar" style={{
                    position: 'relative',
                    width: '36px',
                    height: '36px',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e7eb',
                    flexShrink: 0
                  }}>
                    <span className="avatar-icon text-lg">
                      {user.role === UserRole.OWNER && '🏪'}
                      {user.role === UserRole.EMPLOYEE && '👨‍💼'}
                      {user.role === UserRole.FARMER && '👨‍🌾'}
                      {user.role === UserRole.BUYER && '🛒'}
                    </span>
                    {user.role === UserRole.OWNER && (
                      <span className="owner-crown" style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        fontSize: '0.75rem',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                      }}>👑</span>
                    )}
                  </div>
                  <div className="user-details text-right">
                    <div className="user-name text-sm font-medium text-gray-900">{user.username}</div>
                    <div className="user-role text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="logout-btn flex items-center justify-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header