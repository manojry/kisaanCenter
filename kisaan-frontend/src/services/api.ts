// (config import removed after refactor eliminating direct fetch usage)
// Settlements API
export const settlementsApi = {
  getAll: (params?: {
    shop_id?: number;
    settlementUser_id?: number;
    status?: string;
    reason?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Settlement>> =>
    // Using helper utilities for query + normalization
    (async () => {
      const qs = buildQueryString(params);
      const raw = await apiClient.get<PaginatedResponse<Settlement>>(`${SETTLEMENT_ENDPOINTS.BASE}${qs}`);
      return normalizeListResponse<Settlement>(raw, { keys: ['data'], limit: params?.limit, page: params?.page });
    })(),

  getById: (id: number): Promise<ApiResponse<Settlement>> =>
    apiClient.get<ApiResponse<Settlement>>(`${SETTLEMENT_ENDPOINTS.BASE}/${id}`),

  create: (settlement: {
    shop_id: number;
    settlementUser_id: number;
    owner_id?: number;
    amount: number;
    reason: 'overpayment' | 'underpayment' | 'adjustment';
    notes?: string;
  }): Promise<ApiResponse<Settlement>> =>
    apiClient.post<ApiResponse<Settlement>>(SETTLEMENT_ENDPOINTS.BASE, settlement),

  update: (id: number, update: {
    status?: 'pending' | 'settled';
    settlement_date?: string;
    notes?: string;
  }): Promise<ApiResponse<Settlement>> =>
    apiClient.put<ApiResponse<Settlement>>(`${SETTLEMENT_ENDPOINTS.BASE}/${id}`, update),

  getSummary: (): Promise<ApiResponse<{
    total_pending: number;
    total_settled: number;
    count_pending: number;
    count_settled: number;
  }>> =>
    apiClient.get<ApiResponse<{
      total_pending: number;
      total_settled: number;
      count_pending: number;
      count_settled: number;
    }>>(SETTLEMENT_ENDPOINTS.SUMMARY),
};
export const shopProductsApi = {
  getShops: async (user: User | null) => {
    if (user?.role === 'owner' && user?.shop_id) {
      const single = await apiClient.get<ApiResponse<Shop>>(SHOP_ENDPOINTS.BY_ID(user.shop_id));
      return single?.data ? [single.data] : [];
    }
    const resp = await apiClient.get<ApiResponse<Shop[]>>(SHOP_ENDPOINTS.BASE);
    return resp.data || [];
  },
  getCategories: async () => {
    const resp = await apiClient.get<ApiResponse<Category[]>>(CATEGORY_ENDPOINTS.BASE);
    const categories = resp.data || [];
    // Note: status field removed from category model, return all categories
    return categories;
  },
  getProducts: async (categoryId: number) => {
    const resp = await apiClient.get<ApiResponse<Product[]>>(`${PRODUCT_ENDPOINTS.BASE}${buildQueryString({ category_id: categoryId })}`);
    const products = resp.data || [];
    return products.filter((p) => p.record_status === 'active');
  },
  getShopProducts: async (shopId: number) => {
    // The backend may return extra fields for shop products, so we use a mapped type
    type ShopProductMapped = Product & {
      shop_id: number;
      product_id: number;
      product_name: string;
      category?: { id: number; name: string };
      category_name?: string;
      is_active?: boolean;
      // legacy fields
      category_id?: number;
      record_status?: string;
    };
    const resp = await apiClient.get<ApiResponse<ShopProductMapped[]>>(SHOP_ENDPOINTS.PRODUCTS(shopId));
    const list: ShopProductMapped[] = resp.data || [];
    return list.map((p) => ({
      id: p.id,
      shop_id: shopId,
      product_id: p.product_id ?? p.id,
      product_name: p.product_name ?? p.name,
      category: p.category || (p.category_id ? { id: p.category_id, name: (p as any).category_name || '' } : undefined),
      category_name: (p.category && p.category.name) || (p as any).category_name || '',
      is_active: typeof p.is_active !== 'undefined' ? !!p.is_active : (p.record_status === 'active')
    }));
  },
  getAvailableProducts: async (shopId: number) => {
  const resp = await apiClient.get<ApiResponse<Product[]>>(SHOP_ENDPOINTS.AVAILABLE_PRODUCTS(shopId));
  return resp.data || [];
  },
  getAssignableProducts: async (shopId: number) => {
  const resp = await apiClient.get<ApiResponse<Product[]>>(SHOP_ENDPOINTS.ASSIGNABLE_PRODUCTS(shopId));
  return resp.data || [];
  },
  getTransactionProducts: async (shopId: number, farmerId?: number) => {
  const resp = await apiClient.get<ApiResponse<Product[]>>(SHOP_ENDPOINTS.TRANSACTION_PRODUCTS(shopId, farmerId));
  return resp.data || [];
  },
  assignProduct: (shopId: number, productId: number) =>
    apiClient.post(SHOP_ENDPOINTS.PRODUCT_ASSIGN(shopId, productId)),
  removeProduct: (shopId: number, productId: number) =>
    apiClient.delete(SHOP_ENDPOINTS.PRODUCT_ASSIGN(shopId, productId)),
    toggleProductStatus: (shopId: number, productId: number, isActive: boolean) =>
      apiClient.patch(SHOP_ENDPOINTS.PRODUCT_ASSIGN(shopId, productId), { is_active: !isActive })
};
// Balance Snapshots API
export const balanceSnapshotsApi = {
  getByUserId: async (userId: number | string) => {
  const resp = await apiClient.get<ApiResponse<any[]>>(BALANCE_ENDPOINTS.SNAPSHOTS_BY_USER(userId));
  return resp.data || [];
  }
};
// Superadmin Dashboard API
export const superadminDashboardApi = {
  getDashboard: async () => apiClient.get(DASHBOARD_ENDPOINTS.SUPERADMIN.DASHBOARD),
  getRecentShops: async () => {
  const resp = await apiClient.get<ApiResponse<Shop[]>>(`${SHOP_ENDPOINTS.BASE}${buildQueryString({ limit: 5 })}`);
  return resp.data || [];
  }
};
// Owner Dashboard API
export const ownerDashboardApi = {
  getStats: async () => apiClient.get(DASHBOARD_ENDPOINTS.OWNER.DASHBOARD)
};
// Analytics API
export const analyticsApi = {
  getShopAnalytics: async (shopId: number, dateRange?: { from: string; to: string }) => {
    const qs = buildQueryString({
      shop_id: shopId,
      date_from: dateRange?.from,
      date_to: dateRange?.to
    });
    const raw = await apiClient.get<ApiResponse<any>>(`${TRANSACTION_ENDPOINTS.ANALYTICS}${qs}`);
    return raw?.data || raw || null;
  }
};
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
import { TRANSACTION_ENDPOINTS, USER_ENDPOINTS, CATEGORY_ENDPOINTS, PRODUCT_ENDPOINTS, SETTLEMENT_ENDPOINTS, SHOP_ENDPOINTS, PAYMENT_ENDPOINTS, BALANCE_ENDPOINTS, REPORT_ENDPOINTS, EXPENSE_ENDPOINTS, DASHBOARD_ENDPOINTS, SIMPLIFIED_ENDPOINTS, FARMER_PRODUCT_ENDPOINTS } from './endpoints';
// Helper utilities centralizing query string construction & list response normalization
import { buildQueryString, normalizeListResponse, normalizeSingleItemResponse } from './serviceHelpers';
/**
 * NOTE: Selected list endpoints (users, products, transactions, payments farmer) now use
 * buildQueryString + normalizeListResponse for consistent behavior.
 * TODO: Gradually migrate remaining endpoints that manually use URLSearchParams or ad-hoc
 * response shape parsing to these helpers for uniformity & reduced duplication.
 * Recent migrations (batch 2): settlements, payments.getAll, shops, reports, analytics,
 * shopProducts (products fetch), expense, dashboard summaries.
 * Remaining potential improvements: introduce constants for transactions earnings/list endpoints
 * currently using inline template strings (see TODO comments in transactionsApi), and unify any
 * residual direct array response handling with normalizeListResponse where pagination is desired.
 */
import { buildTransactionPayload } from '../utils/buildTransactionPayload';
import type { BuildTransactionInput } from '../utils/buildTransactionPayload';
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
    apiClient.post('/auth/login', credentials), // could use AUTH_ENDPOINTS if imported
  
  logout: (): Promise<ApiResponse> =>
    apiClient.post('/auth/logout'),
  
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    apiClient.get(USER_ENDPOINTS.ME)
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
  const qs = buildQueryString(params);
  const raw = await apiClient.get<ApiResponse<User[]>>(`${USER_ENDPOINTS.BASE}${qs}`);
  // Backend now returns { success: true, data: users[], message: "...", meta: {...} }
  return normalizeListResponse<User>(raw, { keys: ['data'], limit: params?.limit, page: params?.page });
  },
  
  getById: (id: number): Promise<{ message: string; user: User }> =>
    apiClient.get(USER_ENDPOINTS.BY_ID(id)),
  
  create: async (user: UserCreate): Promise<ApiResponse<User>> => {
  const raw = await apiClient.post<ApiResponse<User>>(USER_ENDPOINTS.BASE, user);
  const normalizedUser = normalizeSingleItemResponse<User>(raw, 'user');
    return {
      success: raw.success || true,
      message: raw.message || 'User created successfully',
      data: normalizedUser || undefined
    };
  },
  
  update: async (id: number, user: Partial<User>): Promise<ApiResponse<User>> => {
  const raw = await apiClient.put<ApiResponse<User>>(USER_ENDPOINTS.BY_ID(id), user);
  const normalizedUser = normalizeSingleItemResponse<User>(raw, 'user');
    return {
      success: raw.success || true,
      message: raw.message || 'User updated successfully',
      data: normalizedUser || undefined
    };
  },
  
  delete: (id: number): Promise<ApiResponse> =>
    apiClient.delete(USER_ENDPOINTS.BY_ID(id)),
  
  resetPassword: (id: number, passwords: { currentPassword: string; newPassword: string }): Promise<ApiResponse> =>
    apiClient.post(USER_ENDPOINTS.RESET_PASSWORD(id), passwords)
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    const response = await apiClient.get(CATEGORY_ENDPOINTS.BASE) as any;
    return {
      success: true,
      message: 'Categories fetched',
      data: response.data || response.categories || response || []
    };
  },
  
  getActive: async (): Promise<ApiResponse<Category[]>> => {
    // Note: /categories/active endpoint removed, using same as getAll
    const response = await apiClient.get(CATEGORY_ENDPOINTS.BASE) as any;
    return {
      success: true,
      message: 'Active categories fetched',
      data: response.data || response.categories || response || []
    };
  },
  
  search: (query: string): Promise<ApiResponse<Category[]>> =>
    apiClient.get(CATEGORY_ENDPOINTS.SEARCH(query)),
  
  getById: (id: number): Promise<ApiResponse<Category>> =>
    apiClient.get(`${CATEGORY_ENDPOINTS.BASE}/${id}`),
  
  create: (category: { name: string; status?: string }): Promise<ApiResponse<Category>> =>
    apiClient.post(CATEGORY_ENDPOINTS.BASE, category),
  
  update: (id: number, category: { name: string; status?: string }): Promise<ApiResponse<Category>> =>
    apiClient.put(`${CATEGORY_ENDPOINTS.BASE}/${id}`, category),
  
  delete: (id: number): Promise<ApiResponse> =>
    apiClient.delete(`${CATEGORY_ENDPOINTS.BASE}/${id}`)
};

// Products API
export const productsApi = {
  getAll: async (params?: {
    category_id?: number;
    record_status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> => {
    const qs = buildQueryString(params);
    const raw = await apiClient.get(`${PRODUCT_ENDPOINTS.BASE}${qs}`) as any;
    return normalizeListResponse<Product>(raw, { keys: ['data'], limit: params?.limit, page: params?.page });
  },
  
  getById: (id: number): Promise<ApiResponse<Product>> =>
    apiClient.get(PRODUCT_ENDPOINTS.BY_ID(id)),
  
  create: (product: { name: string; category_id: number; record_status?: string }): Promise<ApiResponse<Product>> =>
    apiClient.post(PRODUCT_ENDPOINTS.BASE, product),
  
  update: (id: number, product: { name: string; category_id: number; record_status?: string }): Promise<ApiResponse<Product>> =>
    apiClient.put(PRODUCT_ENDPOINTS.BY_ID(id), product),
  
  delete: (id: number): Promise<ApiResponse> =>
    apiClient.delete(PRODUCT_ENDPOINTS.BY_ID(id))
};

// Shops API
export const shopsApi = {
  getAvailableOwners: async () => {
    try {
      // Try the dedicated endpoint first
      const raw = await apiClient.get<ApiResponse<User[]>>(SHOP_ENDPOINTS.AVAILABLE_OWNERS);
      const normalized = normalizeListResponse<User>(raw, { keys: ['data'] });
      return normalized.data;
    } catch {
      console.warn('Available owners endpoint not found, falling back to filtering all users');
      // Fallback: Get all owners and filter out those who already have shops
      try {
        const [usersResponse, shopsResponse] = await Promise.all([
          usersApi.getAll({ role: 'owner' }),
          shopsApi.getAll()
        ]);
        const allOwners = usersResponse.data || [];
        const allShops = shopsResponse.data || [];
        const ownersWithShops = new Set(allShops.map(shop => shop.owner_id).filter(Boolean));
        // Return owners who don't have shops yet
        return allOwners.filter(owner => !ownersWithShops.has(owner.id));
      } catch {
        // fallback error
        return [];
      }
    }
  },
  getAll: async (params?: {
    status?: string;
    owner_id?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Shop>> => {
  const qs = buildQueryString(params);
  const raw = await apiClient.get<ApiResponse<Shop[]>>(`${SHOP_ENDPOINTS.BASE}${qs}`);
  return normalizeListResponse<Shop>(raw, { keys: ['data'], limit: params?.limit, page: params?.page });
  },
  
  getById: (id: number): Promise<ApiResponse<Shop>> =>
    apiClient.get(SHOP_ENDPOINTS.BY_ID(id)),
  
  create: (shop: { name: string; owner_id: number; address: string; contact: string; plan_id?: number }): Promise<ApiResponse<Shop>> =>
    apiClient.post(SHOP_ENDPOINTS.BASE, shop),
  
  update: (id: number, shop: Partial<Shop>): Promise<ApiResponse<Shop>> =>
    apiClient.put(SHOP_ENDPOINTS.BY_ID(id), shop),
  
  delete: (id: number): Promise<ApiResponse> =>
    apiClient.delete(SHOP_ENDPOINTS.BY_ID(id)),
  
  getProducts: (id: number): Promise<ApiResponse<Product[]>> =>
    apiClient.get(SHOP_ENDPOINTS.PRODUCTS(id)),
  
  assignProduct: (shopId: number, productId: number): Promise<ApiResponse> =>
    apiClient.post(SHOP_ENDPOINTS.PRODUCT_ASSIGN(shopId, productId)),
  
  removeProduct: (shopId: number, productId: number): Promise<ApiResponse> =>
    apiClient.delete(SHOP_ENDPOINTS.PRODUCT_ASSIGN(shopId, productId))
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
    const qs = buildQueryString(params);
    const raw = await apiClient.get(`${TRANSACTION_ENDPOINTS.BASE}${qs}`) as any;
    return normalizeListResponse<Transaction>(raw, { keys: ['data'], limit: params?.limit, page: params?.page });
  },
  
  getById: (id: number): Promise<ApiResponse<Transaction>> =>
    apiClient.get(TRANSACTION_ENDPOINTS.BY_ID(id)),
  
  create: (transaction: TransactionCreate): Promise<ApiResponse<Transaction>> =>
    apiClient.post(TRANSACTION_ENDPOINTS.BASE, transaction),

  // New helper: build payload from raw input using centralized builder
  createFromInput: (input: BuildTransactionInput): Promise<ApiResponse<Transaction>> => {
    const payload = buildTransactionPayload(input);
    return apiClient.post(TRANSACTION_ENDPOINTS.BASE, payload);
  },
  
  getByShop: (shopId: number): Promise<PaginatedResponse<Transaction>> =>
    apiClient.get(TRANSACTION_ENDPOINTS.SHOP_BASE(shopId)),
  
  getShopEarnings: (shopId: number): Promise<ApiResponse<TransactionSummary>> =>
    apiClient.get(TRANSACTION_ENDPOINTS.SHOP_EARNINGS(shopId)),
  
  getFarmerEarnings: (farmerId: number): Promise<ApiResponse<TransactionSummary>> =>
    apiClient.get(TRANSACTION_ENDPOINTS.FARMER_EARNINGS(farmerId)),
  
  getBuyerPurchases: (buyerId: number): Promise<PaginatedResponse<Transaction>> =>
    apiClient.get(TRANSACTION_ENDPOINTS.BUYER_PURCHASES(buyerId))
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
    apiClient.post(PAYMENT_ENDPOINTS.BULK, bulk),
  getAll: (params?: {
    transaction_id?: number;
    status?: string;
    payer_type?: string;
    payee_type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Payment>> =>
    (async () => {
      const qs = buildQueryString(params);
      const raw = await apiClient.get(`${PAYMENT_ENDPOINTS.BASE}${qs}`) as any;
      return normalizeListResponse<Payment>(raw, { keys: ['data'], limit: params?.limit, page: params?.page });
    })(),
  
  getById: (id: number): Promise<ApiResponse<Payment>> =>
    apiClient.get(PAYMENT_ENDPOINTS.BY_ID(id)),
  
  create: (payment: {
    transaction_id: number;
    payer_type: 'BUYER' | 'SHOP';
    payee_type: 'SHOP' | 'FARMER';
    amount: number;
    method?: string;
    notes?: string;
    payment_date?: string;
  }): Promise<ApiResponse<Payment>> =>
    apiClient.post(PAYMENT_ENDPOINTS.BASE, payment),
  
  updateStatus: (id: number, update: {
    status: 'PENDING' | 'PAID' | 'FAILED';
    payment_date?: string;
    notes?: string;
  }): Promise<ApiResponse<Payment>> =>
    apiClient.put(PAYMENT_ENDPOINTS.STATUS(id), update),
  
  getByTransaction: (transactionId: number): Promise<ApiResponse<Payment[]>> =>
    apiClient.get(PAYMENT_ENDPOINTS.BY_TRANSACTION(transactionId)),
  
  getOutstanding: (): Promise<PaginatedResponse<Payment>> =>
    apiClient.get(PAYMENT_ENDPOINTS.OUTSTANDING),
  
  getFarmerPayments: async (farmerId: number): Promise<PaginatedResponse<Payment>> => {
  const raw = await apiClient.get<ApiResponse<Payment[]>>(PAYMENT_ENDPOINTS.FARMER(farmerId));
  return normalizeListResponse<Payment>(raw, { keys: ['data'] });
  },
  
  getBuyerPayments: (buyerId: number): Promise<PaginatedResponse<Payment>> =>
    apiClient.get(PAYMENT_ENDPOINTS.BUYER(buyerId))
};

// Expense API
export const expenseApi = {
  addExpense: (payload: { shop_id: number; user_id: number; amount: number; reason?: string; description?: string; }): Promise<ApiResponse> =>
    apiClient.post(EXPENSE_ENDPOINTS.BASE, payload),
  getExpenses: (shop_id: number): Promise<ApiResponse<any[]>> =>
  apiClient.get<ApiResponse<{ id: number; shop_id: number; user_id: number; amount: number; reason?: string; description?: string; created_at: string; updated_at: string; }[]>>(`${EXPENSE_ENDPOINTS.BASE}${buildQueryString({ shop_id })}`)
};

// Dashboard API - using available endpoints
export const dashboardApi = {
  getBusinessSummary: async (): Promise<ApiResponse<BusinessSummary>> => {
    // Use transactions analytics to build summary
  const transactionsRes = await apiClient.get<ApiResponse<any>>(TRANSACTION_ENDPOINTS.ANALYTICS);
  const usersRes = await apiClient.get<ApiResponse<User[]>>(USER_ENDPOINTS.BASE);
  const shopsRes = await apiClient.get<ApiResponse<Shop[]>>(SHOP_ENDPOINTS.BASE);
    return {
      success: true,
      message: 'Business summary',
      data: {
        totalUsers: usersRes.data?.length || 0,
        totalTransactions: (transactionsRes.data && (transactionsRes.data as any).total_transactions) ? (transactionsRes.data as any).total_transactions : 0,
        totalPayments: 0,
        totalSettlements: 0,
        totalRevenue: (transactionsRes.data && (transactionsRes.data as any).total_value) ? (transactionsRes.data as any).total_value : 0,
        activeShops: shopsRes.data?.filter((s: Shop) => s.status === 'active').length || 0,
        pendingPayments: 0
      }
    };
  },
  
  getRecentTransactions: (limit?: number): Promise<ApiResponse<Transaction[]>> =>
    apiClient.get(`${TRANSACTION_ENDPOINTS.BASE}${buildQueryString(limit ? { limit } : undefined)}`)
};

// Balance API
export const balanceApi = {
  getUserBalance: (id: number): Promise<ApiResponse<{ balance: number; cumulative_value: number }>> =>
    apiClient.get(BALANCE_ENDPOINTS.USER(id)),
  
  getShopBalance: (id: number): Promise<ApiResponse<{ balance: number }>> =>
    apiClient.get(BALANCE_ENDPOINTS.SHOP(id)),
  
  updateBalance: (update: {
    amount: number;
    operation: 'add' | 'subtract' | 'set';
    reason?: string;
  }): Promise<ApiResponse> =>
    apiClient.post(BALANCE_ENDPOINTS.UPDATE, update)
};

// Reports API - using available endpoints
export const reportsApi = {
  getSales: (params?: { from_date?: string; to_date?: string }): Promise<ApiResponse> =>
    apiClient.get(`${REPORT_ENDPOINTS.SALES}${buildQueryString(params)}`),

  getTransactions: (params?: { from_date?: string; to_date?: string }): Promise<ApiResponse> =>
    apiClient.get(`${REPORT_ENDPOINTS.TRANSACTIONS}${buildQueryString(params)}`),

  getSuperadminDashboard: (): Promise<ApiResponse> =>
    apiClient.get('/superadmin/dashboard')
};

// Simplified Transaction API - Easy to use endpoints
export const simplifiedApi = {
  // Test connection
  test: (): Promise<ApiResponse<{ message: string; timestamp: string }>> =>
    apiClient.get(SIMPLIFIED_ENDPOINTS.TEST),

  // Get user balance with clear explanation
  getBalance: (userId: number): Promise<ApiResponse<{
    user_id: number;
    username: string;
    role: string;
    balance: number;
    balance_meaning: string;
  }>> =>
    apiClient.get(SIMPLIFIED_ENDPOINTS.BALANCE(userId)),

  // Create transaction with automatic balance updates
  createTransaction: (data: {
    shop_id: number;
    farmer_id: number;
    buyer_id: number;
    category_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    commission_rate?: number;
    transaction_date?: string;
    notes?: string;
    payments?: Array<{
      payer_type: 'BUYER' | 'SHOP';
      payee_type: 'SHOP' | 'FARMER';
      amount: number;
      method: string;
      status?: string;
      payment_date?: string;
      notes?: string;
    }>;
  }): Promise<ApiResponse<{
    transaction: any;
    payments?: any[];
    balance_updates: {
      farmer: { old_balance: number; new_balance: number };
    };
  }>> =>
    apiClient.post(SIMPLIFIED_ENDPOINTS.TRANSACTION, data),

  // Record payment to reduce user balance
  recordPayment: (data: {
    user_id: number;
    amount: number;
    payment_type: 'farmer_payment' | 'buyer_payment';
    notes?: string;
  }): Promise<ApiResponse<any>> =>
    apiClient.post(SIMPLIFIED_ENDPOINTS.PAYMENT, data),

  // Record expense or advance
  recordExpense: (data: {
    user_id: number;
    amount: number;
    expense_type: 'shop_expense' | 'user_advance';
    description: string;
    shop_id: number;
  }): Promise<ApiResponse<any>> =>
    apiClient.post(SIMPLIFIED_ENDPOINTS.EXPENSE, data)
};

// Farmer Product API - for farmer-specific product assignments
export const farmerProductApi = {
  // Get farmer's assigned products with prices
  getFarmerProducts: async (farmerId: number): Promise<ApiResponse<any[]>> => {
    try {
      const raw = await apiClient.get<ApiResponse<Product[]>>(FARMER_PRODUCT_ENDPOINTS.FARMER_PRODUCTS(farmerId));
      let data: Product[] = [];
      if (Array.isArray(raw)) {
        data = raw as Product[];
      } else if (Array.isArray(raw.data)) {
        data = raw.data;
      }
      return {
        success: true,
        message: 'Farmer products fetched',
        data
      };
    } catch (err) {
      console.warn(`Error fetching farmer products for ${farmerId}:`, err);
      return {
        success: false,
        message: 'Failed to fetch farmer products',
        data: []
      };
    }
  },

  // Assign product to farmer
  assignProduct: (farmerId: number, productId: number, makeDefault?: boolean): Promise<ApiResponse<any>> =>
    apiClient.post<ApiResponse<Product>>(FARMER_PRODUCT_ENDPOINTS.ASSIGN_PRODUCT(farmerId), { 
      product_id: productId, 
      make_default: makeDefault 
    }),

  // Set product as default for farmer
  setDefault: (farmerId: number, productId: number): Promise<ApiResponse<any>> =>
  apiClient.put<ApiResponse<Product>>(FARMER_PRODUCT_ENDPOINTS.SET_DEFAULT(farmerId, productId))
};