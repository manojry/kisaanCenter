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
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  description: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  created_at: string;
  // Relations
  user?: User;
}

export interface AuditFilter {
  user_id?: string;
  action?: AuditAction;
  entity_type?: AuditEntityType;
  entity_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  total_logs: number;
  actions_summary: Record<AuditAction, number>;
  entities_summary: Record<AuditEntityType, number>;
  users_summary: Record<string, number>;
}
