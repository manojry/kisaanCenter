
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
