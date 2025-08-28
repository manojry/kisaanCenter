import { apiClient } from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { User } from '@/types/entities'
import { APIResponse, PaginationParams } from '@/types/api'

export interface CreateUserData {
  username: string
  password: string
  role: string
  shop_id?: number
  contact?: string
  credit_limit?: number
}

export interface UpdateUserData {
  username?: string
  contact?: string
  credit_limit?: number
  status?: string
}

export const userApi = {
  getUsers: async (params?: PaginationParams & {
    shop_id?: number
    role?: string
    status?: string
    search?: string
  }): Promise<APIResponse<User[]>> => {
    return apiClient.get(ENDPOINTS.USERS, params)
  },

  getUserById: async (id: number, includeRelations = false): Promise<APIResponse<User>> => {
    return apiClient.get(ENDPOINTS.USER_BY_ID(id), { include_relations: includeRelations })
  },

  createUser: async (userData: CreateUserData): Promise<APIResponse<User>> => {
    return apiClient.post(ENDPOINTS.USERS, userData)
  },

  updateUser: async (id: number, userData: UpdateUserData): Promise<APIResponse<User>> => {
    return apiClient.put(ENDPOINTS.USER_BY_ID(id), userData)
  },

  deleteUser: async (id: number): Promise<APIResponse<void>> => {
    return apiClient.delete(ENDPOINTS.USER_BY_ID(id))
  },

  getUsersByShop: async (shopId: number): Promise<APIResponse<User[]>> => {
    return apiClient.get(ENDPOINTS.USERS_BY_SHOP(shopId))
  },

  getFarmersWithStock: async (shopId: number): Promise<APIResponse<User[]>> => {
    return apiClient.get(ENDPOINTS.FARMERS_WITH_STOCK(shopId))
  },

  getBuyersWithCredit: async (shopId: number): Promise<APIResponse<User[]>> => {
    return apiClient.get(ENDPOINTS.BUYERS_WITH_CREDIT(shopId))
  },

  updateCreditLimit: async (id: number, newLimit: number, updatedById: number): Promise<APIResponse<User>> => {
    return apiClient.put(ENDPOINTS.UPDATE_CREDIT_LIMIT(id), {
      new_limit: newLimit,
      updated_by_id: updatedById
    })
  }
}