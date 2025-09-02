export enum UserRole {
  SuperAdmin = 'superadmin',
  Owner = 'owner',
  Buyer = 'buyer',
  Farmer = 'farmer',
}

export enum RecordStatus {
  Active = 'active',
  Inactive = 'inactive',
  Deleted = 'deleted',
}

export interface Shop {
  id: number;
  name: string;
  address: string;
  owner_user_id: number;
  status: RecordStatus;
}

export interface FarmerStock {
  id: number;
  farmer_user_id: number;
  product_id: number;
  quantity: number;
}

export interface Transaction {
  id: number;
  buyer_user_id: number;
  farmer_user_id: number;
  type: string;
  status: string;
  commission_rate: number;
  date: string;
  items: any[];
}

export interface Credit {
  id: number;
  buyer_user_id: number;
  amount: number;
  status: RecordStatus;
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  shop_id?: number;
  contact?: string;
  credit_limit: number;
  created_at: string;
  updated_at: string;
  status: RecordStatus;
}

export interface UserWithRelations extends User {
  shop?: Shop;
  owned_shops: Shop[];
  farmer_stocks: FarmerStock[];
  buyer_transactions: Transaction[];
  credits_as_buyer: Credit[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
  shop_id?: number;
  contact?: string;
  credit_limit?: number;
  created_by?: number;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: UserRole;
  shop_id?: number;
  contact?: string;
  credit_limit?: number;
  status?: RecordStatus;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  shop_id?: number;
  role?: string;
  user_status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
