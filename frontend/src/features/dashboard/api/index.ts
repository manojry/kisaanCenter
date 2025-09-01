import { apiClient } from '@/services/api';

export interface ShopDashboardData {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    totalCommission: number;
    pendingPayments: number;
  };
  today: {
    transactions: number;
    commission: number;
  };
  month: {
    transactions: number;
    commission: number;
  };
  active_users: {
    farmers: number;
    buyers: number;
  };
}

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

export const dashboardApi = {
  async getShopDashboard(shopId: string) {
    try {
      const response = await apiClient.get<ShopDashboardData>(`/shops/${shopId}/dashboard`);
      return response;
    } catch (error) {
      console.error('Failed to fetch shop dashboard:', error);
      throw error;
    }
  },

  async getSystemDashboard() {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch system dashboard:', error);
      throw error;
    }
  },

  async getOwnerMetrics(ownerId: string) {
    try {
      const response = await apiClient.get(`/owners/${ownerId}/metrics`);
      return response;
    } catch (error) {
      console.error('Failed to fetch owner metrics:', error);
      throw error;
    }
  },
};
