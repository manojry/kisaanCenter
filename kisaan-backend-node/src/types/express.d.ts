import { UserRole } from '../schemas/user';

declare global {
  namespace Express {
    interface Request {
      // Optional user payload attached by authentication middleware
      user?: {
        id: number;
        username: string;
        role: UserRole | string;
        shop_id?: number | null;
      };
    }
  }
}

export {};

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
