import { useQuery, useMutation, useQueryClient } from 'react-query'
import { userApi, CreateUserData, UpdateUserData } from '../api'
import { PaginationParams } from '@/types/api'
import toast from 'react-hot-toast'

export const useUsers = (params?: PaginationParams & {
  shop_id?: number
  role?: string
  status?: string
  search?: string
}) => {
  return useQuery(
    ['users', params],
    () => userApi.getUsers(params),
    {
      keepPreviousData: true,
    }
  )
}

export const useUser = (id: number, includeRelations = false) => {
  return useQuery(
    ['user', id, includeRelations],
    () => userApi.getUserById(id, includeRelations),
    {
      enabled: !!id,
    }
  )
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    (userData: CreateUserData) => userApi.createUser(userData),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users'])
        toast.success(response.message || 'User created successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create user')
      }
    }
  )
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    ({ id, userData }: { id: number; userData: UpdateUserData }) => 
      userApi.updateUser(id, userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        toast.success('User updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user')
      }
    }
  )
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    (id: number) => userApi.deleteUser(id),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users'])
        toast.success(response.message || 'User deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete user')
      }
    }
  )
}

export const useUsersByShop = (shopId: number) => {
  return useQuery(
    ['users', 'shop', shopId],
    () => userApi.getUsersByShop(shopId),
    {
      enabled: !!shopId,
    }
  )
}

export const useFarmersWithStock = (shopId: number) => {
  return useQuery(
    ['farmers', 'with-stock', shopId],
    () => userApi.getFarmersWithStock(shopId),
    {
      enabled: !!shopId,
    }
  )
}

export const useBuyersWithCredit = (shopId: number) => {
  return useQuery(
    ['buyers', 'with-credit', shopId],
    () => userApi.getBuyersWithCredit(shopId),
    {
      enabled: !!shopId,
    }
  )
}

export const useUpdateCreditLimit = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    ({ id, newLimit, updatedById }: { id: number; newLimit: number; updatedById: number }) => 
      userApi.updateCreditLimit(id, newLimit, updatedById),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        toast.success('Credit limit updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update credit limit')
      }
    }
  )
}