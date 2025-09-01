import { apiClient } from '@/services/api';
import { LoginCredentials, AuthResponse, APIResponse, User } from './types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<APIResponse<AuthResponse>> => {
    return apiClient.post('/auth/login', credentials);
  },
  logout: async (): Promise<APIResponse<void>> => {
    return apiClient.post('/auth/logout');
  },
  refreshToken: async (): Promise<APIResponse<AuthResponse>> => {
    return apiClient.post('/auth/refresh');
  },
  getCurrentUser: async (): Promise<APIResponse<User>> => {
    return apiClient.get('/auth/me');
  },
};