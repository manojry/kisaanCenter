import { Request } from 'express';

export interface AuthUser {
  id: number;
  username: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  shop_id?: number | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
