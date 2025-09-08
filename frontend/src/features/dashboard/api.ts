import { apiClient } from '../../services/api';
import { APIResponse, ShopDashboardData, DashboardSummary, DashboardAlert, HealthStatus } from './types';

export const getDashboardStats = async () => {
  // TODO: Implement dashboard stats API call
  return { data: {} };
};

export const dashboardApi = {
  getShopDashboard: async (shopId: string): Promise<APIResponse<ShopDashboardData>> => {
    // Use simple analytics endpoint without path parameters
    return apiClient.get(`/transactions/analytics?shop_id=${shopId}`);
  },
  getShopDashboardSummary: async (shopId: string): Promise<APIResponse<DashboardSummary>> => {
    // Use owner-admin endpoint for summary data
    return apiClient.get(`/owner-admin/shops/${shopId}/analytics`);
  },
  getShopDashboardAlerts: async (_shopId: string): Promise<APIResponse<DashboardAlert[]>> => {
    // For now, return empty alerts - can be implemented later
    return Promise.resolve({ success: true, message: "No alerts", data: [] });
  },
  getHealthCheck: async (): Promise<APIResponse<HealthStatus>> => {
    return apiClient.get('/dashboard/health');
  },
};




// System stats

// Performance data



// Revenue and trends

// System health
