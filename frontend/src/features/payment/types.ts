// Payment entity type based on API contract
export interface Payment {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'UPI' | 'WALLET';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}
