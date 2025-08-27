// API endpoint constants matching backend
export const ENDPOINTS = {
  // Health
  HEALTH: '/health',
  API_INFO: '/info',

  // Authentication
  LOGIN: '/users/auth/login',

  // Users
  USERS: '/users',
  USER_BY_ID: (id: number) => `/users/${id}`,
  USERS_BY_SHOP: (shopId: number) => `/users/shop/${shopId}`,
  FARMERS_WITH_STOCK: (shopId: number) => `/users/farmers/with-stock/${shopId}`,
  BUYERS_WITH_CREDIT: (shopId: number) => `/users/buyers/with-credit/${shopId}`,
  UPDATE_CREDIT_LIMIT: (id: number) => `/users/${id}/credit-limit`,

  // Shops
  SHOPS: '/shops',
  SHOP_BY_ID: (id: number) => `/shops/${id}`,

  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: number) => `/products/${id}`,

  // Transactions
  TRANSACTIONS: '/transactions',
  TRANSACTION_BY_ID: (id: number) => `/transactions/${id}`,
  CONFIRM_COMMISSION: (id: number) => `/transactions/${id}/confirm-commission`,
  TRANSACTION_SUMMARY: (id: number) => `/transactions/${id}/summary`,
  SHOP_DASHBOARD: (shopId: number) => `/transactions/shop/${shopId}/dashboard`,
  INCOMPLETE_TRANSACTIONS: '/transactions/completion-status/pending',

  // Payments
  PAYMENTS: '/payments',
  PAYMENT_BY_ID: (id: number) => `/payments/${id}`,

  // Credits
  CREDITS: '/credits',
  CREDIT_BY_ID: (id: number) => `/credits/${id}`,
} as const