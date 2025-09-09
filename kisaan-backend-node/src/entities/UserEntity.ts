// src/entities/UserEntity.ts
// Entity representing the database structure for User

export class UserEntity {
  id?: number;
  username?: string;
  password?: string;
  role?: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  owner_id?: string | null;
  shop_id?: number | null;
  contact?: string | null;
  email?: string | null;
  status?: 'active' | 'inactive';
  balance?: number;
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;

  constructor(init?: Partial<UserEntity>) {
    Object.assign(this, init);
  }
}
