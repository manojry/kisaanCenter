// DTOs for Shop API input/output
export interface ShopDTO {
  id: number;
  name: string;
  owner_id: string;
  address?: string | null;
  contact?: string | null;
  status: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateShopDTO {
  name: string;
  owner_id: string;
  address?: string | null;
  contact?: string | null;
}

export interface UpdateShopDTO {
  name?: string;
  address?: string | null;
  contact?: string | null;
  status?: 'active' | 'inactive';
}
