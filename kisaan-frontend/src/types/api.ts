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
  status: 'active' | 'inactive';
  balance: number;
  cumulative_value: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  firstname?: string;
}

export interface UserCreate {
  username?: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  shop_id?: number;
  contact?: string;
  email?: string;
  password: string;
  status?: 'active' | 'inactive';
  balance?: number;
  cumulative_value?: number;
  firstname?: string; // For auto-generating usernames
}

export interface Category {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  record_status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: number;
  name: string;
  owner_id: number;
  plan_id?: number;
  address: string;
  contact: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
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
  total_sale_value: number;
  shop_commission: number;
  farmer_earning: number;
  status: 'pending' | 'completed' | 'cancelled' | 'to_collect' | 'credit' | 'partial' | 'farmer_due';
  transaction_date: string;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
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
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
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
  token: string;
  user: User;
}