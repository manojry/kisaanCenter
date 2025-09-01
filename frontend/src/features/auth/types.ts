export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  shop_id?: number | null;
}
import { UserRole } from '@/types/enums'

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthUser {
  id: number
  username: string
  role: UserRole
  shop_id: number | null
  user_id: number
  token?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface Permission {
  action: string
  resource: string
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPERADMIN]: ['*:*'], // All permissions
  [UserRole.OWNER]: [
    'read:shop',
    'update:shop',
    'create:user',
    'read:user',
    'update:user',
    'delete:user',
    'read:transaction',
    'update:transaction',
    'confirm:commission',
    'read:dashboard',
    'read:reports'
  ],
  [UserRole.EMPLOYEE]: [
    'read:shop',
    'create:transaction',
    'read:transaction',
    'update:transaction',
    'read:user',
    'read:stock'
  ],
  [UserRole.FARMER]: [
    'read:stock',
    'update:stock',
    'read:transaction',
    'read:payment'
  ],
  [UserRole.BUYER]: [
    'read:transaction',
    'read:payment',
    'read:credit'
  ]
}