import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { AuthState, AuthUser, ROLE_PERMISSIONS } from '@/features/auth/types'
import { authApi } from '@/features/auth/api'
import { UserRole } from '@/types/enums'

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (action: string, resource: string) => boolean
  canAccessShop: (shopId: number) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGIN_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'INIT_AUTH'; payload: AuthUser | null }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true }
    case 'LOGIN_SUCCESS':
      return { 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false 
      }
    case 'LOGIN_ERROR':
      return { 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      }
    case 'LOGOUT':
      return { 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      }
    case 'INIT_AUTH':
      return {
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      }
    default:
      return state
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      let user: AuthUser | null = null;
      if (token) {
        const response = await authApi.getCurrentUser();
        if (response.success && response.data) {
          // Map User to AuthUser (add user_id, token)
          user = {
            ...response.data,
            user_id: response.data.id,
            token,
            shop_id: response.data.shop_id ?? null,
          };
        }
      }
      dispatch({ type: 'INIT_AUTH', payload: user });
    };
    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authApi.login({ username, password });
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.access_token);
        // Map User to AuthUser (add user_id, token)
        const authUser: AuthUser = {
          ...response.data.user,
          user_id: response.data.user.id,
          token: response.data.access_token,
          shop_id: response.data.user.shop_id ?? null,
        };
        dispatch({ type: 'LOGIN_SUCCESS', payload: authUser });
      } else {
        dispatch({ type: 'LOGIN_ERROR' });
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR' });
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Optionally log error
    } finally {
      dispatch({ type: 'LOGOUT' });
      localStorage.removeItem('auth_token');
    }
  };

  const hasPermission = (action: string, resource: string): boolean => {
    if (!state.user) return false
    
    const userPermissions = ROLE_PERMISSIONS[state.user.role] || []
    
    // Superadmin has all permissions
    if (userPermissions.includes('*:*')) return true
    
    // Check specific permission
    return userPermissions.includes(`${action}:${resource}`)
  }

  const canAccessShop = (shopId: number): boolean => {
    if (!state.user) return false
    
    // Superadmin can access all shops
    if (state.user.role === UserRole.SUPERADMIN) return true
    
    // Others can only access their own shop
    return state.user.shop_id === shopId
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      hasPermission,
      canAccessShop
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}