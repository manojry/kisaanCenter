import React, { createContext, useContext, useReducer, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  isSystemTheme: boolean
}

interface ThemeContextType extends ThemeState {
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  useSystemTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

type ThemeAction = 
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'TOGGLE_THEME' }
  | { type: 'USE_SYSTEM_THEME' }
  | { type: 'INIT_THEME'; payload: { theme: Theme; isSystemTheme: boolean } }

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME':
      return { 
        theme: action.payload, 
        isSystemTheme: false 
      }
    case 'TOGGLE_THEME':
      return { 
        theme: state.theme === 'light' ? 'dark' : 'light', 
        isSystemTheme: false 
      }
    case 'USE_SYSTEM_THEME':
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      return { 
        theme: systemTheme, 
        isSystemTheme: true 
      }
    case 'INIT_THEME':
      return action.payload
    default:
      return state
  }
}

const getInitialTheme = (): ThemeState => {
  // Check localStorage first
  const savedTheme = localStorage.getItem('kisaan-theme')
  const savedIsSystem = localStorage.getItem('kisaan-theme-system') === 'true'
  
  if (savedTheme && !savedIsSystem) {
    return { theme: savedTheme as Theme, isSystemTheme: false }
  }
  
  // Use system preference as default
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return { theme: systemTheme, isSystemTheme: true }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, getInitialTheme())

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(state.theme)
    root.setAttribute('data-theme', state.theme)
    
    // Save to localStorage
    if (!state.isSystemTheme) {
      localStorage.setItem('kisaan-theme', state.theme)
      localStorage.setItem('kisaan-theme-system', 'false')
    } else {
      localStorage.removeItem('kisaan-theme')
      localStorage.setItem('kisaan-theme-system', 'true')
    }
  }, [state.theme, state.isSystemTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (!state.isSystemTheme) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (state.isSystemTheme) {
        dispatch({ type: 'INIT_THEME', payload: { theme: e.matches ? 'dark' : 'light', isSystemTheme: true } })
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [state.isSystemTheme])

  const setTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' })
  }

  const useSystemTheme = () => {
    dispatch({ type: 'USE_SYSTEM_THEME' })
  }

  return (
    <ThemeContext.Provider value={{
      ...state,
      setTheme,
      toggleTheme,
      useSystemTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}