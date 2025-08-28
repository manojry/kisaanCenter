import { Product } from '../product/types';
import { Payment } from '../payment/types';

export enum TransactionStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETE = 'complete',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export enum TransactionType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  RETURN = 'RETURN'
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  farmer_id: string;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  shop_id: string;
  buyer_user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  buyer_paid_amount: number;
  farmer_paid_amount: number;
  commission_confirmed: boolean;
  commission_rate: number;
  commission_amount: number;
  total_amount: number;
  transaction_items: TransactionItem[];
  payments: Payment[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  shop_id: string;
  buyer_user_id: string;
  type: TransactionType;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    farmer_id: string;
  }[];
  notes?: string;
}

export interface UpdateTransactionRequest {
  status?: TransactionStatus;
  buyer_paid_amount?: number;
  farmer_paid_amount?: number;
  commission_confirmed?: boolean;
  notes?: string;
}

export interface TransactionSummary {
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  completed_transactions: number;
  pending_transactions: number;
  partial_transactions: number;
}
