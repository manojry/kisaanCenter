// Import types for specific response structures
import { Transaction } from './transaction'
import { User } from './user.types'
import { Product } from '../features/product/types'

// API response types - CENTRALIZED FOR CONSISTENT TYPING
export interface APIResponse<T = any> {
  success: boolean
  message: string
  data: T
  pagination?: PaginationInfo
  errors?: string[]
}

// Standardized pagination from backend
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number  // Backend uses total_pages, not pages
}

// Frontend pagination parameters
export interface PaginationParams {
  page?: number
  limit?: number
}

// Transactions API specific response structure
export interface TransactionListResponse {
  transactions: Transaction[]  // Backend wraps in transactions array
  pagination: PaginationInfo
}

// Users API specific response structure  
export interface UserListResponse {
  users: User[]  // Backend wraps in users array
  pagination: PaginationInfo
}

// Products API specific response structure
export interface ProductListResponse {
  products: Product[]  // Backend wraps in products array
  pagination: PaginationInfo
}

// Dashboard data types
export interface DashboardData {
  total_transactions: number
  pending_transactions: number
  completed_transactions: number
  total_sales: number
  total_commission: number
  outstanding_credits: number
  active_farmers: number
  active_buyers: number
  completion_rate: number
}

// Transaction summary
export interface TransactionSummary {
  transaction_id: number
  total_amount: number
  commission_amount: number
  net_farmer_amount: number
  buyer_paid_amount: number
  farmer_paid_amount: number
  outstanding_buyer_amount: number
  outstanding_farmer_amount: number
  completion_percentage: number
  commission_confirmed: boolean
  status: string
  completion_status: string
}

// Error response
export interface ErrorResponse {
  success: false
  message: string
  error_code?: string
  path?: string
  timestamp?: number
}