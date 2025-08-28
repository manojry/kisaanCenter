// Credit entity type based on API contract
export interface Credit {
  id: string;
  user_id: string;
  shop_id: string;
  amount: number;
  status: 'active' | 'repaid' | 'overdue';
  created_at: string;
  updated_at: string;
}
