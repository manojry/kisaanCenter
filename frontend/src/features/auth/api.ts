import { apiClient } from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { LoginCredentials, AuthUser } from './types'
import { APIResponse } from '@/types/api'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<APIResponse<AuthUser>> => {
    interface LoginResponse {
      id: number
      username: string
      role: string
      shop_id: number | null
      user_id: number
      access_token: string
    }
    
    const response = await apiClient.post<LoginResponse>(
      ENDPOINTS.LOGIN,
      {
        username: credentials.username,
        password: credentials.password
      }
    )
    
    if (!response.data) {
      throw new Error('Invalid response from server')
    }

    const data = response.data
    
    // Store token first
    localStorage.setItem('auth_token', data.access_token)
    
    // Create user object without the token
    const { access_token, ...userData } = data
    
    // Store user data
    localStorage.setItem('auth_user', JSON.stringify(userData))
    
    // Return formatted response
    return {
      success: true,
      message: 'Login successful',
      data: {
        ...userData,
        token: access_token,
      } as AuthUser
    }
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  },

  getCurrentUser: (): AuthUser | null => {
    const userStr = localStorage.getItem('auth_user')
    return userStr ? JSON.parse(userStr) : null
  },

  setAuthData: (user: AuthUser, token: string): void => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  }
}