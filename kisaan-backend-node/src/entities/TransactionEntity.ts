/**
 * TransactionEntity - Domain Entity for Transaction
 */
export class TransactionEntity {
  id?: number;
  shop_id?: number;
  farmer_id?: number;
  buyer_id?: number;
  product_id?: number;
  category_id?: number;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  total_amount?: number;
  commission_rate?: number;
  commission_type?: string;
  commission_amount?: number;
  farmer_earning?: number;
  status?: 'pending' | 'completed' | 'cancelled' | 'settled';
  transaction_date?: Date;
  settlement_date?: Date | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: Date;
  updated_at?: Date;

  payments?: unknown[];

  constructor(init?: Partial<TransactionEntity>) {
    Object.assign(this, init);
  }
}