// API endpoint constants matching backend
export const ENDPOINTS = {
  LOGIN: '/users/auth/login',
  LOGOUT: '/users/auth/logout',
  REFRESH_TOKEN: '/users/auth/refresh',
  OWNER_RESET_PASSWORD: (shopId: number, userId: number) => `/owner-admin/shops/${shopId}/users/${userId}/password`,
  OWNER_COMMISSION: (shopId: number) => `/owner-admin/shops/${shopId}/commission`,
  OWNER_ASSIGN_PRODUCTS: (shopId: number) => `/owner-admin/shops/${shopId}/products`,
  OWNER_SHOP_PRODUCTS: (shopId: number) => `/owner-admin/shops/${shopId}/products`,
  DASHBOARD_OWNER: (shopId: number) => `/dashboard/shop/${shopId}`,
  DASHBOARD_SUMMARY: (shopId: number) => `/dashboard/shop/${shopId}/summary`,
  DASHBOARD_ALERTS: (shopId: number) => `/dashboard/shop/${shopId}/alerts`,
  STOCK_FARMER: '/farmer-stock/',
  STOCK_STATUS: (shopId: number) => `/farmer-stock/status/${shopId}`,
  TRANSACTION_CONFIRM_COMMISSION: (transactionId: number) => `/transactions/${transactionId}/confirm-commission`,
  TRANSACTION_SUMMARY: (transactionId: number) => `/transactions/${transactionId}/summary`,
  TRANSACTION_INCOMPLETE: '/transactions/completion-status/pending',
  HEALTH: '/health',
  API_INFO: '/info',

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
  SHOP_DASHBOARD: (shopId: number) => `/transactions/shop/${shopId}/dashboard`,
  INCOMPLETE_TRANSACTIONS: '/transactions/completion-status/pending',

  // Payments
  PAYMENTS: '/payments',
  PAYMENT_BY_ID: (id: number) => `/payments/${id}`,

  // Credits
  CREDITS: '/credits',
  CREDIT_BY_ID: (id: number) => `/credits/${id}`,
} as const