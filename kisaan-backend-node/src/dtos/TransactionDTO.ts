export interface CreateTransactionDTO {
  shop_id: number;
  farmer_id: number;
  buyer_id: number;
  category_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface TransactionResponseDTO {
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
  created_at: Date;
  updated_at: Date;
}

export interface TransactionSummaryDTO {
  total_transactions: number;
  total_sales: number;
  total_commission: number;
  total_farmer_earnings: number;
}