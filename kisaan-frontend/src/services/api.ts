// Transaction Form Data API
export const getTransactionFormData = async () => {
  // Fetch all required data in parallel
  const [farmersRes, buyersRes, productsRes, categoriesRes] = await Promise.all([
    usersApi.getAll({ role: 'farmer' }),
    usersApi.getAll({ role: 'buyer' }),
    productsApi.getAll(),
    categoriesApi.getAll()
  ]);
  return {
    farmers: farmersRes.data,
    buyers: buyersRes.data,
    products: productsRes.data,
    categories: categoriesRes.data
  };
};
// Centralized API service layer
import { apiClient } from './apiClient';
import type {
  User,
  UserCreate,
  Category,
  Product,
  Shop,
  Transaction,
  TransactionCreate,
  Payment,
  Settlement,
  ApiResponse,
  PaginatedResponse,
  BusinessSummary,
  TransactionSummary,
  LoginRequest,
  LoginResponse
} from '../types/api';

// Authentication API
export const authApi = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    apiClient.post('/auth/login', credentials),
  
  logout: (): Promise<ApiResponse> =>
    apiClient.post('/auth/logout'),
  
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    apiClient.get('/users/me')
};

// Users API
export const usersApi = {
  getAll: async (params?: {
    role?: string;
    status?: string;
    shop_id?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
  const response = await apiClient.get(`/users?${queryParams.toString()}`) as any;
  // Handle different response formats from backend
  const users = response.data || response.users || response || [];
    
    return {
      data: Array.isArray(users) ? users : [],
      total: Array.isArray(users) ? users.length : 0,
      page: 1,
      limit: params?.limit || 10,
      totalPages: 1
    };
  },
  
  getById: (id: number): Promise<{ message: string; user: User }> =>
    apiClient.get(`/users/${id}`),
  
  create: (user: UserCreate): Promise<ApiResponse<User>> =>
    apiClient.post('/users', user),
  
  update: (id: number, user: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.put(`/users/${id}`, user),
  
  delete: (id: number): Promise<ApiResponse> =>
    apiClient.delete(`/users/${id}`),
  
  resetPassword: (id: number, passwords: { currentPassword: string; newPassword: string }): Promise<ApiResponse> =>
    apiClient.post(`/users/${id}/reset-password`, passwords)
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    const response = await apiClient.get('/categories') as any;
    return {
      success: true,
      message: 'Categories fetched',
      data: response.data || response.categories || response || []
    };
  },
  
  getActive: async (): Promise<ApiResponse<Category[]>> => {
    const response = await apiClient.get('/categories/active') as any;
    return {
      success: true,
      message: 'Active categories fetched',
      data: response.data || response.categories || response || []
    };
  },
  
  search: (query: string): Promise<ApiResponse<Category[]>> =>
    apiClient.get(`/categories/search?q=${encodeURIComponent(query)}`),
  
  getById: (id: number): Promise<ApiResponse<Category>> =>
    apiClient.get(`/categories/${id}`),
  
  create: (category: { name: string; status?: string }): Promise<ApiResponse<Category>> =>
    apiClient.post('/categories', category),
  
  update: (id: number, category: { name: string; status?: string }): Promise<ApiResponse<Category>> =>
    apiClient.put(`/categories/${id}`, category),
  
  delete: (id: number): Promise<ApiResponse> =>
    apiClient.delete(`/categories/${id}`)
};

// Products API
export const productsApi = {
  getAll: async (params?: {
    category_id?: number;
    record_status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
  const response = await apiClient.get(`/products?${queryParams.toString()}`) as any;
  // Handle different response formats from backend
  const products = response.data || response.products || response || [];
    
    return {
      data: Array.isArray(products) ? products : [],
      total: Array.isArray(products) ? products.length : 0,
      page: 1,
      limit: params?.limit || 10,
      totalPages: 1
    };
  },
  
  getById: (id: number): Promise<ApiResponse<Product>> =>
    apiClient.get(`/products/${id}`),
  
  create: (product: { name: string; category_id: number; record_status?: string }): Promise<ApiResponse<Product>> =>
    apiClient.post('/products', product),
  
  update: (id: number, product: { name: string; category_id: number; record_status?: string }): Promise<ApiResponse<Product>> =>
    apiClient.put(`/products/${id}`, product),
  
  delete: (id: number): Promise<ApiResponse> =>
    apiClient.delete(`/products/${id}`)
};

// Shops API
export const shopsApi = {
  getAll: async (params?: {
    status?: string;
    owner_id?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Shop>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/shops?${queryParams.toString()}`) as any;
    return {
      data: response.data || [],
      total: response.data?.length || 0,
      page: 1,
      limit: params?.limit || 10,
      totalPages: 1
    };
  },
  
  getById: (id: number): Promise<ApiResponse<Shop>> =>
    apiClient.get(`/shops/${id}`),
  
  create: (shop: { name: string; owner_id: number; address: string; contact: string; plan_id?: number }): Promise<ApiResponse<Shop>> =>
    apiClient.post('/shops', shop),
  
  update: (id: number, shop: Partial<Shop>): Promise<ApiResponse<Shop>> =>
    apiClient.put(`/shops/${id}`, shop),
  
  delete: (id: number): Promise<ApiResponse> =>
    apiClient.delete(`/shops/${id}`),
  
  getProducts: (id: number): Promise<ApiResponse<Product[]>> =>
    apiClient.get(`/shops/${id}/products`),
  
  assignProduct: (shopId: number, productId: number): Promise<ApiResponse> =>
    apiClient.post(`/shops/${shopId}/products/${productId}`),
  
  removeProduct: (shopId: number, productId: number): Promise<ApiResponse> =>
    apiClient.delete(`/shops/${shopId}/products/${productId}`)
};

// Transactions API
export const transactionsApi = {
  getAll: async (params?: {
    shop_id?: number;
    farmer_id?: number;
    buyer_id?: number;
    status?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Transaction>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/transactions?${queryParams.toString()}`) as any;
    return {
      data: response.data || [],
      total: response.data?.length || 0,
      page: 1,
      limit: params?.limit || 10,
      totalPages: 1
    };
  },
  
  getById: (id: number): Promise<ApiResponse<Transaction>> =>
    apiClient.get(`/transactions/${id}`),
  
  create: (transaction: TransactionCreate): Promise<ApiResponse<Transaction>> =>
    apiClient.post('/transactions', transaction),
  
  getByShop: (shopId: number): Promise<PaginatedResponse<Transaction>> =>
    apiClient.get(`/transactions/shop/${shopId}`),
  
  getShopEarnings: (shopId: number): Promise<ApiResponse<TransactionSummary>> =>
    apiClient.get(`/transactions/shop/${shopId}/earnings`),
  
  getFarmerEarnings: (farmerId: number): Promise<ApiResponse<TransactionSummary>> =>
    apiClient.get(`/transactions/farmer/${farmerId}/earnings`),
  
  getBuyerPurchases: (buyerId: number): Promise<PaginatedResponse<Transaction>> =>
    apiClient.get(`/transactions/buyers/${buyerId}/purchases`)
};

// Payments API
export const paymentsApi = {
  createBulk: (bulk: {
    payments: { transaction_id: number; amount: number }[];
    payer_type: 'BUYER' | 'SHOP';
    payee_type: 'SHOP' | 'FARMER';
    method: string;
    status?: string;
    notes?: string;
  }): Promise<ApiResponse<Payment[]>> =>
    apiClient.post('/payments/bulk', bulk),
  getAll: (params?: {
    transaction_id?: number;
    status?: string;
    payer_type?: string;
    payee_type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Payment>> =>
    apiClient.get('/payments', { url: `/payments?${new URLSearchParams(params as any).toString()}` }),
  
  getById: (id: number): Promise<ApiResponse<Payment>> =>
    apiClient.get(`/payments/${id}`),
  
  create: (payment: {
    transaction_id: number;
    payer_type: 'BUYER' | 'SHOP';
    payee_type: 'SHOP' | 'FARMER';
    amount: number;
    method?: string;
    notes?: string;
    payment_date?: string;
  }): Promise<ApiResponse<Payment>> =>
    apiClient.post('/payments', payment),
  
  updateStatus: (id: number, update: {
    status: 'PENDING' | 'PAID' | 'FAILED';
    payment_date?: string;
    notes?: string;
  }): Promise<ApiResponse<Payment>> =>
    apiClient.put(`/payments/${id}/status`, update),
  
  getByTransaction: (transactionId: number): Promise<ApiResponse<Payment[]>> =>
    apiClient.get(`/payments/transaction/${transactionId}`),
  
  getOutstanding: (): Promise<PaginatedResponse<Payment>> =>
    apiClient.get('/payments/outstanding'),
  
  getFarmerPayments: (farmerId: number): Promise<PaginatedResponse<Payment>> =>
    apiClient.get(`/payments/farmers/${farmerId}`),
  
  getBuyerPayments: (buyerId: number): Promise<PaginatedResponse<Payment>> =>
    apiClient.get(`/payments/buyers/${buyerId}`)
};

// Settlements API
export const settlementsApi = {
  getAll: (params?: {
    shop_id?: number;
    user_id?: number;
    status?: string;
    reason?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Settlement>> =>
    apiClient.get('/settlements', { url: `/settlements?${new URLSearchParams(params as any).toString()}` }),
  
  getById: (id: number): Promise<ApiResponse<Settlement>> =>
    apiClient.get(`/settlements/${id}`),
  
  create: (settlement: {
    shop_id: number;
    user_id: number;
    amount: number;
    reason: 'overpayment' | 'underpayment' | 'adjustment';
    notes?: string;
  }): Promise<ApiResponse<Settlement>> =>
    apiClient.post('/settlements', settlement),
  
  update: (id: number, update: {
    status?: 'pending' | 'settled';
    settlement_date?: string;
    notes?: string;
  }): Promise<ApiResponse<Settlement>> =>
    apiClient.put(`/settlements/${id}`, update),
  
  getSummary: (): Promise<ApiResponse<{
    total_pending: number;
    total_settled: number;
    count_pending: number;
    count_settled: number;
  }>> =>
    apiClient.get('/settlements/summary'),
  
  settle: (settlementId: number): Promise<ApiResponse> =>
    apiClient.post(`/settlements/settle/${settlementId}`)
};

// Dashboard API - using available endpoints
export const dashboardApi = {
  getBusinessSummary: async (): Promise<ApiResponse<BusinessSummary>> => {
    // Use transactions analytics to build summary
    const transactionsRes = await apiClient.get('/transactions/analytics') as any;
    const usersRes = await apiClient.get('/users') as any;
    const shopsRes = await apiClient.get('/shops') as any;
    return {
      success: true,
      message: 'Business summary',
      data: {
        totalUsers: usersRes.data?.length || 0,
        totalTransactions: transactionsRes.data?.total_transactions || 0,
        totalPayments: 0,
        totalSettlements: 0,
        totalRevenue: transactionsRes.data?.total_value || 0,
        activeShops: shopsRes.data?.filter((s: any) => s.status === 'active').length || 0,
        pendingPayments: 0
      }
    };
  },
  
  getRecentTransactions: (limit?: number): Promise<ApiResponse<Transaction[]>> =>
    apiClient.get(`/transactions${limit ? `?limit=${limit}` : ''}`)
};

// Balance API
export const balanceApi = {
  getUserBalance: (id: number): Promise<ApiResponse<{ balance: number; cumulative_value: number }>> =>
    apiClient.get(`/balance/user/${id}`),
  
  getShopBalance: (id: number): Promise<ApiResponse<{ balance: number }>> =>
    apiClient.get(`/balance/shop/${id}`),
  
  updateBalance: (update: {
    amount: number;
    operation: 'add' | 'subtract' | 'set';
    reason?: string;
  }): Promise<ApiResponse> =>
    apiClient.post('/balance/update', update)
};

// Reports API - using available endpoints
export const reportsApi = {
  getSales: (params?: { from_date?: string; to_date?: string }): Promise<ApiResponse> =>
    apiClient.get('/reports/sales', { url: `/reports/sales?${new URLSearchParams(params as any).toString()}` }),
  
  getTransactions: (params?: { from_date?: string; to_date?: string }): Promise<ApiResponse> =>
    apiClient.get('/reports/transactions', { url: `/reports/transactions?${new URLSearchParams(params as any).toString()}` })
};