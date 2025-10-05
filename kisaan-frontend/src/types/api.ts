// Plan type for DRY usage across frontend
export interface Plan {
  id: number;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_users: number;
  max_transactions: number;
  storage_gb: number;
  support_level: string;
  is_popular: boolean;
  is_active: boolean;
}
// Expense type for DRY usage across frontend
export interface Expense {
  id: number;
  user_id: number;
  user?: User;
  amount: number;
  reason: string;
  description?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
}
// Category type for DRY usage across frontend
export interface Category {
  id: number;
  name: string;
  status?: 'active' | 'inactive';
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
// ...existing code...
// ShopProduct type for DRY usage across frontend
export type ShopProduct = {
  id: number;
  shop_id: number;
  product_id: number;
  product_name: string;
  category?: { id?: number; name?: string };
};
// Balance Snapshot type for DRY usage across frontend
export type BalanceSnapshot = {
  id: number;
  user_id: number;
  previous_balance: number;
  new_balance: number;
  amount_change: number | string;
  created_at: string;
  createdAt?: string;
};
// Bulk Payment Types
export interface BulkPaymentItem {
  transaction_id: number;
  amount: number;
}

export interface BulkPaymentRequest {
  payments: BulkPaymentItem[];
  payer_type: 'BUYER' | 'SHOP';
  payee_type: 'SHOP' | 'FARMER';
  method: string;
  status?: string;
  notes?: string;
}
// API Types based on OpenAPI specification
export interface User {
  id: number;
  username: string;
  password: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  shop_id?: number;
  contact?: string;
  email?: string;
  balance: number;
  custom_commission_rate?: number; // Updated to match backend field name
  created_by?: number;
  created_at: string;
  updated_at: string;
  firstname?: string;
  // Computed fields from backend analytics service
  status: 'active' | 'inactive';        // Computed user status
  cumulative_value: number;             // Role-based total value (sales/purchases/commissions)
}

export interface UserCreate {
  username?: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  shop_id?: number;
  contact?: string;
  email?: string;
  password: string;
  balance?: number;
  custom_commission_rate?: number; // Updated to match backend field name
  firstname?: string; // For auto-generating usernames
  // Note: status and cumulative_value removed - not in database schema
}

// ...existing code...

export interface Product {
  id: number;
  name: string;
  category_id: number;
  record_status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface Shop {
  id: number;
  name: string;
  owner_id: number;
  plan_id?: number;
  address: string;
  contact: string;
  status: 'active' | 'inactive';
  commission_rate?: number;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  shop_id: number;
  farmer_id: number;
  buyer_id: number;
  category_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;        // Backend field name (was total_sale_value)
  commission_amount: number;   // Backend field name (was shop_commission)
  farmer_earning: number;
  commission_rate?: number;    // percentage form (e.g. 10 for 10%)
  commission_type?: string;    // Added to match backend
  product_id?: number;         // Added to match backend
  status: 'pending' | 'completed' | 'cancelled' | 'to_collect' | 'credit' | 'partial' | 'farmer_due' | 'active';
  transaction_date: string;
  settlement_date?: string;    // Added to match backend
  notes?: string;              // Added to match backend
  metadata?: Record<string, unknown> | null; // Added to match backend
  created_at: string;
  updated_at?: string;
  payments: Payment[];
  // Enriched fields from backend
  deficit?: number;
  buyer_paid?: number;
  farmer_paid?: number;
  farmer_due?: number;
}

export interface TransactionCreate {
  shop_id: number;
  farmer_id: number;
  buyer_id: number;
  category_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  transaction_date?: string;
}

// Extended creation payload when frontend supplies derived values explicitly
export interface TransactionCreateExtended extends TransactionCreate {
  commission_rate?: number; // percentage input expected by backend
  total_amount?: number;     // Updated to match backend (was total_sale_value)
  commission_amount?: number; // Updated to match backend (was shop_commission)
  farmer_earning?: number;
  payments?: Array<{
    payer_type: 'BUYER' | 'SHOP';
    payee_type: 'SHOP' | 'FARMER';
    amount: number;
    status: 'PAID' | 'PENDING';
    method: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
    payment_date: string;
    notes?: string;
  }>;
}

export interface Payment {
  id: number;
  transaction_id: number;
  payer_type: 'BUYER' | 'SHOP';
  payee_type: 'SHOP' | 'FARMER';
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  payment_date?: string;
  method: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Settlement {
  id: number;
  shop_id: number;
  user_id: number;
  amount: number;
  reason: 'overpayment' | 'underpayment' | 'adjustment';
  status: 'pending' | 'settled';
  settlement_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
}

// Dashboard Types
export interface BusinessSummary {
  totalUsers: number;
  totalTransactions: number;
  totalPayments: number;
  totalSettlements: number;
  totalRevenue: number;
  activeShops: number;
  pendingPayments: number;
}

export interface TransactionSummary {
  total_transactions: number;
  total_value: number;
  total_commission: number;
  pending_count: number;
  completed_count: number;
  average_transaction_value: number;
}

// Login Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}