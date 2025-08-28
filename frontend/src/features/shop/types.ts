// Shop entity type based on API contract
export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  status: 'active' | 'inactive' | 'suspended';
  plan_id: string;
  created_at: string;
  updated_at: string;
}
