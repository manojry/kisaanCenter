import { apiClient } from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { LoginCredentials, AuthUser } from './types'
import { APIResponse } from '@/types/api'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<APIResponse<AuthUser>> => {
    const params = new URLSearchParams({
      username: credentials.username,
      password: credentials.password
    })
    
    return apiClient.post(ENDPOINTS.LOGIN + '?' + params.toString())
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