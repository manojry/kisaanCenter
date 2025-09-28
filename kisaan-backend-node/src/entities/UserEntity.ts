// src/entities/UserEntity.ts
// Entity representing the database structure for User

export class UserEntity {
  id?: number;
  username?: string;
  password?: string;
  role?: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  shop_id?: number | null;
  email?: string | null;
  firstname?: string | null;
  balance?: number;
  created_by?: number | null;
  custom_commission_rate?: number | null;
  created_at?: Date;
  updated_at?: Date;

  constructor(init?: Partial<UserEntity>) {
    Object.assign(this, init);
  }
}
