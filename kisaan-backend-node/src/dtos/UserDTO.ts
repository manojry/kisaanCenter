// src/dtos/UserDTO.ts
// DTOs for User API input/output

export interface UserDTO {
  id: number;
  username: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  owner_id?: string | null;
  shop_id?: number | null;
  contact?: string | null;
  email?: string | null;
  status: 'active' | 'inactive';
  balance: number;
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  owner_id?: string | null;
  shop_id?: number | null;
  contact?: string | null;
  email?: string | null;
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  role?: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  shop_id?: number | null;
  contact?: string | null;
  email?: string | null;
  status?: 'active' | 'inactive';
}
