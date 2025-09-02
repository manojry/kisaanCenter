import { TransactionStatus, PaymentStatus, TransactionType } from './enums';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  pagination?: Pagination;
  onPageChange: (page: number) => void;
  onViewDetails: (transaction: Transaction) => void;
  onCommissionConfirm: (id: number) => Promise<void>;
}

export interface Transaction {
  id: number
  buyer_user_id: number
  buyer_username?: string
  type: TransactionType
  status: TransactionStatus
  payment_status: PaymentStatus
  date: string
  commission_rate: number
  commission_amount: number
  commission_confirmed: boolean
  buyer_paid_amount: number
  farmer_paid_amount: number
  items?: TransactionItem[]
}

export interface TransactionItem {
  id?: number
  product_id: number
  product_name?: string
  quantity: number
  price: number
  farmer_user_id: number
  farmer_stock_id?: number
  status?: string
}

export interface TransactionFormData {
  buyer_user_id: number
  type: TransactionType
  commission_rate: number
  date: string
  items: TransactionItem[]
  farmer_paid_amount: number
  commission_confirmed: boolean
  buyer_paid_amount: number
}

export interface TransactionFilters {
  search: string
  type: string
  status: string
  payment_status: string
  date_from: string
  date_to: string
  buyer_id: string
  category_id?: string
  user_id?: string
}

export interface TransactionAnalytics {
  total_transactions: number
  total_amount: number
  pending_payments: number
  commission_earned: number
  today_transactions: number
  today_amount: number
  total_revenue: number
  total_commission: number
  average_transaction_value: number
  growth_percentage?: {
    transactions?: number
    revenue?: number 
    commission?: number
  }
  daily_revenue?: Array<{date: string, amount: number}>
  transaction_by_type?: Array<{type: string, count: number}>
  daily_commission?: Array<{date: string, amount: number}>
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: Pagination;
}
