export interface CreatePaymentDTO {
  transaction_id?: number; // Optional for advance payments
  payer_type: 'BUYER' | 'SHOP';
  payee_type: 'SHOP' | 'FARMER';
  amount: number;
  method: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
  status?: 'PENDING' | 'PAID' | 'FAILED';
  notes?: string;
  counterparty_id?: number; // Required for direct/advance payments (farmer or buyer)
  shop_id?: number; // Optional, for direct/advance payments to associate with a shop
  payment_date?: string | Date; // Allow backdated payment timestamps from payload
}

// For bulk payments
export interface BulkPaymentItemDTO {
  transaction_id: number;
  amount: number;
}

export interface BulkPaymentDTO {
  payments: BulkPaymentItemDTO[];
  payer_type: 'BUYER' | 'SHOP';
  payee_type: 'SHOP' | 'FARMER';
  method: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
  status?: 'PENDING' | 'PAID' | 'FAILED';
  notes?: string;
}

export interface PaymentResponseDTO {
  id: number;
  transaction_id: number;
  payer_type: 'BUYER' | 'SHOP';
  payee_type: 'SHOP' | 'FARMER';
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  payment_date?: Date;
  method: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
  notes?: string;
  created_at: Date;
}

export interface UpdatePaymentStatusDTO {
  status: 'PAID' | 'FAILED';
  payment_date?: Date;
  notes?: string;
}