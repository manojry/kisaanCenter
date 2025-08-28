// Product entity type based on API contract
export interface Product {
  id: number;
  name: string;
  price: number;
  shop_id: number;
  // Optional fields that might be added later
  category_id?: string;
  unit?: string;
  status?: 'active' | 'inactive' | 'suspended';
  created_at?: string;
  updated_at?: string;
}
