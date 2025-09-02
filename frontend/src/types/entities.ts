import { UserRole, TransactionStatus, PaymentStatus, CreditStatus, CompletionStatus, TransactionType, PaymentMethod } from './enums'

// Core entity types matching backend ERD
export interface User {
  id: number
  username: string
  password_hash: string
  role: UserRole
  shop_id?: number
  contact?: string
  credit_limit?: number
  record_status: string
  created_by?: number
  created_at: string
  updated_at: string
}

export interface Shop {
  id: number
  name: string
  address: string
  owner_user_id: number
  plan?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  description?: string
  category?: string // Keeping for backward compatibility
  category_id?: number // From backend
  unit?: string // Keeping for frontend compatibility
  price?: number // From backend
  default_price?: number // Keeping for frontend compatibility
  shop_product_id?: number // Keeping for frontend compatibility
  status: string
  created_at: string
  updated_at: string
}

export interface FarmerStock {
  id: number
  farmer_id: number
  product_id: number
  quantity: number
  rate: number
  status: string
  created_at: string
  updated_at: string
  farmer?: User
  product?: Product
}

export interface Transaction {
  id: number
  shop_id: number
  buyer_user_id: number
  type: TransactionType
  status: TransactionStatus
  total_amount: number
  commission_rate: number
  commission_amount: number
  buyer_paid_amount: number
  farmer_paid_amount: number
  commission_confirmed: boolean
  completion_status: CompletionStatus
  created_at: string
  updated_at: string
  buyer?: User
  shop?: Shop
  transaction_items?: TransactionItem[]
  payments?: Payment[]
}

export interface TransactionItem {
  id: number
  transaction_id: number
  product_id: number
  farmer_stock_id: number
  quantity: number
  rate: number
  amount: number
  created_at: string
  updated_at: string
  product?: Product
  farmer_stock?: FarmerStock
}

export interface Payment {
  id: number
  transaction_id: number
  payer_user_id: number
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  created_at: string
  updated_at: string
  payer?: User
  transaction?: Transaction
}

export interface Credit {
  id: number
  transaction_id: number
  user_id: number
  amount: number
  status: CreditStatus
  created_at: string
  updated_at: string
  user?: User
  transaction?: Transaction
}

export interface Plan {
  id: number
  name: string
  description?: string
  monthly_price: number
  quarterly_price?: number
  yearly_price?: number
  max_farmers: number
  max_buyers: number
  max_transactions: number
  data_retention_months: number
  features?: Record<string, any>
  status: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: number
  shop_id: number
  plan_id: number
  billing_cycle: string
  start_date: string
  end_date: string
  auto_renew: boolean
  status: string
  payment_status: string
  amount: number
  discount_amount?: number
  created_at: string
  updated_at: string
  shop?: Shop
  plan?: Plan
}