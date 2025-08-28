// Product entity type based on API contract
export interface Product {
  id: string;
  name: string;
  category_id: string;
  unit: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}
