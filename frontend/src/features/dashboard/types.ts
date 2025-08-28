import { Transaction } from '../transaction/types';
import { StockSummary } from '../stock/types';
import { Payment } from '../payment/types';
import { Product } from '../product/types';
import { Credit } from '../credit/types';
import { AuditLog } from '../audit/types';

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_shops: number;
  active_shops: number;
  total_transactions: number;
  total_revenue: number;
  total_commission: number;
  pending_payments: number;
}

export interface OwnerDashboard {
  shop_stats: {
    total_transactions: number;
    today_transactions: number;
    total_revenue: number;
    today_revenue: number;
    total_commission_earned: number;
    pending_commission: number;
    active_farmers: number;
    active_buyers: number;
  };
  recent_transactions: Transaction[];
  stock_summary: StockSummary;
  top_products: ProductPerformance[];
  pending_payments: Payment[];
}

export interface FarmerDashboard {
  stock_stats: StockSummary;
  sales_stats: {
    total_sales: number;
    this_month_sales: number;
    total_earned: number;
    pending_payments: number;
    average_price: number;
  };
  recent_sales: Transaction[];
  stock_alerts: StockAlert[];
  payment_history: Payment[];
}

export interface BuyerDashboard {
  purchase_stats: {
    total_purchases: number;
    this_month_purchases: number;
    total_spent: number;
    credit_used: number;
    credit_available: number;
    pending_payments: number;
  };
  recent_purchases: Transaction[];
  payment_history: Payment[];
  favorite_products: Product[];
  credit_history: Credit[];
}

export interface EmployeeDashboard {
  daily_stats: {
    transactions_handled: number;
    revenue_generated: number;
    customers_served: number;
    stock_updates: number;
  };
  recent_activities: AuditLog[];
  pending_tasks: Task[];
  shop_performance: ShopPerformance;
}

export interface SuperAdminDashboard {
  system_stats: DashboardStats;
  shop_performance: ShopPerformance[];
  user_activity: UserActivity[];
  revenue_trends: RevenueData[];
  system_health: SystemHealth;
  recent_activities: AuditLog[];
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  total_sales: number;
  total_quantity: number;
  total_revenue: number;
  average_price: number;
}

export interface StockAlert {
  stock_id: string;
  product_name: string;
  current_quantity: number;
  alert_type: 'LOW_STOCK' | 'EXPIRED' | 'EXPIRING_SOON';
  alert_message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'STOCK_UPDATE' | 'PAYMENT_FOLLOW_UP' | 'COMMISSION_CONFIRM' | 'USER_VERIFICATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigned_to: string;
  due_date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface ShopPerformance {
  shop_id: string;
  shop_name: string;
  total_transactions: number;
  total_revenue: number;
  commission_earned: number;
  active_farmers: number;
  active_buyers: number;
  growth_percentage: number;
}

export interface UserActivity {
  user_id: string;
  username: string;
  role: string;
  last_login: string;
  total_transactions: number;
  activity_score: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  transactions: number;
  commission: number;
}

export interface SystemHealth {
  server_status: 'HEALTHY' | 'WARNING' | 'ERROR';
  database_status: 'HEALTHY' | 'WARNING' | 'ERROR';
  api_response_time: number;
  active_connections: number;
  memory_usage: number;
  disk_usage: number;
}
