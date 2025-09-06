// Entity representing the database structure for Shop
export class ShopEntity {
  id?: number;
  name?: string;
  owner_id?: string;
  address?: string | null;
  contact?: string | null;
  status?: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
  constructor(init?: Partial<ShopEntity>) {
    Object.assign(this, init);
  }
}
