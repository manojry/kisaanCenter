import { User } from '@/types/entities'
import { UserRole } from '@/types/enums'

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthUser extends User {
  token?: string
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
  ],
  [UserRole.GUEST]: ['read:public']
}