import { User } from '../user/types';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  TRANSACTION_COMPLETE = 'TRANSACTION_COMPLETE',
  PAYMENT_MADE = 'PAYMENT_MADE',
  STOCK_ADJUST = 'STOCK_ADJUST',
  COMMISSION_CONFIRM = 'COMMISSION_CONFIRM'
}

export enum AuditEntityType {
  USER = 'USER',
  SHOP = 'SHOP',
  PRODUCT = 'PRODUCT',
  TRANSACTION = 'TRANSACTION',
  PAYMENT = 'PAYMENT',
  CREDIT = 'CREDIT',
  FARMER_STOCK = 'FARMER_STOCK',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT'
}

export interface AuditLog {
  id: string;
  user_id: string;
  shop_id?: number;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Relations
  user?: User;
}

export interface AuditFilter {
  user_id?: string;
  shop_id?: number;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface AuditSummary {
  total_logs: number;
  actions_summary: Record<AuditAction, number>;
  entities_summary: Record<AuditEntityType, number>;
  users_summary: Record<string, number>;
}
