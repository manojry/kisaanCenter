export interface User {
  id: string;
  username: string;
  role: 'SUPERADMIN' | 'OWNER' | 'FARMER' | 'BUYER' | 'EMPLOYEE' | 'GUEST';
  shop_id?: string;
  contact?: string;
  credit_limit?: number;
  status: 'active' | 'inactive' | 'suspended';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  role: User['role'];
  shop_id?: string;
  contact?: string;
  credit_limit?: number;
}

export interface UserUpdateRequest {
  username?: string;
  role?: User['role'];
  shop_id?: string;
  contact?: string;
  credit_limit?: number;
  status?: User['status'];
}
