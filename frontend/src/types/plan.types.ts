
export interface Plan {
  id: number;
  name: string;
  description?: string;
  monthly_price: number;
  quarterly_price?: number;
  yearly_price?: number;
  max_farmers: number;
  max_buyers: number;
  max_transactions: number;
  data_retention_months: number;
  features?: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
}
