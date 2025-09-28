/**
 * Custom hooks for API data fetching
 * Using React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import type { 
  User, 
  Shop, 
  Product, 
  Transaction, 
  Payment, 
  Credit, 
  PaginatedResponse
} from '@/types';

// Query keys for caching
export const QUERY_KEYS = {
  USERS: ['users'] as const,
  SHOPS: ['shops'] as const,
  PRODUCTS: ['products'] as const,
  TRANSACTIONS: ['transactions'] as const,
  PAYMENTS: ['payments'] as const,
  CREDITS: ['credits'] as const,
  FARMER_STOCK: ['farmer-stock'] as const,
  DASHBOARD: ['dashboard'] as const,
} as const;

// Generic hook for GET requests
export function useApiQuery<T>(
  key: readonly unknown[],
  url: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<T>({
    queryKey: key,
    queryFn: () => apiClient.get<T>(url),
    enabled: isAuthenticated,
    ...options,
  });
}

// Generic hook for mutations
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context, action) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context, action);
    },
    ...options,
  });
}

// User management hooks
export function useUsers() {
  return useApiQuery<PaginatedResponse<User>>(
    [...QUERY_KEYS.USERS],
    '/users'
  );
}

export function useUser(id: string) {
  return useApiQuery<User>(
    [...QUERY_KEYS.USERS, id],
    `/users/${id}`,
    {
      enabled: !!id,
    }
  );
}

export function useCreateUser() {
  return useApiMutation(
    (userData: Partial<User>) => apiClient.post<User>('/users', userData)
  );
}

export function useUpdateUser() {
  return useApiMutation(
    ({ id, ...userData }: { id: string } & Partial<User>) =>
      apiClient.put<User>(`/users/${id}`, userData)
  );
}

export function useDeleteUser() {
  return useApiMutation(
    (id: string) => apiClient.delete(`/users/${id}`)
  );
}

// Shop management hooks
export function useShops() {
  return useApiQuery<PaginatedResponse<Shop>>(
    QUERY_KEYS.SHOPS,
    '/shops'
  );
}

export function useShop(id: string) {
  return useApiQuery<Shop>(
    [...QUERY_KEYS.SHOPS, id],
    `/shops/${id}`,
    {
      enabled: !!id,
    }
  );
}

export function useCreateShop() {
  return useApiMutation(
    (shopData: Partial<Shop>) => apiClient.post<Shop>('/shops', shopData)
  );
}

// Product management hooks
export function useProducts(shopId?: string) {
  const params = shopId ? `?shop_id=${shopId}` : '';
  
  return useApiQuery<PaginatedResponse<Product>>(
    [...QUERY_KEYS.PRODUCTS, shopId],
    `/products${params}`
  );
}

export function useProduct(id: string) {
  return useApiQuery<Product>(
    [...QUERY_KEYS.PRODUCTS, id],
    `/products/${id}`,
    {
      enabled: !!id,
    }
  );
}

export function useCreateProduct() {
  return useApiMutation(
    (productData: Partial<Product>) => apiClient.post<Product>('/products', productData)
  );
}

// Transaction management hooks
export function useTransactions() {
  return useApiQuery<PaginatedResponse<Transaction>>(
    [...QUERY_KEYS.TRANSACTIONS],
    '/transactions'
  );
}

export function useTransaction(id: string) {
  return useApiQuery<Transaction>(
    [...QUERY_KEYS.TRANSACTIONS, id],
    `/transactions/${id}`,
    {
      enabled: !!id,
    }
  );
}

export function useCreateTransaction() {
  return useApiMutation(
    (transactionData: Partial<Transaction>) => 
      apiClient.post<Transaction>('/transactions', transactionData)
  );
}

export function useUpdateTransaction() {
  return useApiMutation(
    ({ id, ...transactionData }: { id: string } & Partial<Transaction>) =>
      apiClient.put<Transaction>(`/transactions/${id}`, transactionData)
  );
}

// Payment management hooks
export function usePayments() {
  return useApiQuery<PaginatedResponse<Payment>>(
    QUERY_KEYS.PAYMENTS,
    '/payments'
  );
}

export function useCreatePayment() {
  return useApiMutation(
    (paymentData: Partial<Payment>) => apiClient.post<Payment>('/payments', paymentData)
  );
}

// Credit management hooks
export function useCredits(userId?: string) {
  const params = userId ? `?user_id=${userId}` : '';
  
  return useApiQuery<PaginatedResponse<Credit>>(
    [...QUERY_KEYS.CREDITS, userId],
    `/credits${params}`
  );
}

// Stock management hooks
// FarmerStock hooks removed (type does not exist)

// Dashboard hooks
export function useDashboard(role: string, userId?: string) {
  const endpoint = role === 'OWNER' ? '/owner-dashboard/dashboard' :
                  role === 'FARMER' ? '/farmer/dashboard' :
                  role === 'BUYER' ? '/buyer/dashboard' :
                  role === 'EMPLOYEE' ? '/employee/dashboard' :
                  '/dashboard';
  
  return useApiQuery<any>(
    [...QUERY_KEYS.DASHBOARD, role, userId],
    endpoint
  );
}