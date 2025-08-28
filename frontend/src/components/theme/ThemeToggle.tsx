import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import './ThemeToggle.css'

const ThemeToggle: React.FC = () => {
  const { theme, isSystemTheme, setTheme, useSystemTheme } = useTheme()

  return (
    <div className="theme-toggle">
      <div className="theme-toggle-options">
        <button
          className={`theme-option ${!isSystemTheme && theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
          title="Light theme"
          aria-label="Switch to light theme"
        >
          <span className="theme-icon">☀️</span>
          <span className="theme-label">Light</span>
        </button>
        
        <button
          className={`theme-option ${!isSystemTheme && theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
          title="Dark theme"
          aria-label="Switch to dark theme"
        >
          <span className="theme-icon">🌙</span>
          <span className="theme-label">Dark</span>
        </button>
        
        <button
          className={`theme-option ${isSystemTheme ? 'active' : ''}`}
          onClick={useSystemTheme}
          title="Follow system theme"
          aria-label="Use system theme preference"
        >
          <span className="theme-icon">🖥️</span>
          <span className="theme-label">System</span>
        </button>
      </div>
    </div>
  )
}

export default ThemeToggle