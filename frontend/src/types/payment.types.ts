
export interface Payment {
  id: number;
  transaction_id: number;
  amount: number;
  payment_method_id: number;
  type: PaymentType;
  date: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  status: RecordStatus;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export enum PaymentType {
  FULL_PAYMENT = 'FULL_PAYMENT',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
  ADVANCE = 'ADVANCE'
}
