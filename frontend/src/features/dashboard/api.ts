import { apiClient } from '../../services/api';
import { APIResponse, ShopDashboardData, DashboardSummary, DashboardAlert, HealthStatus } from './types';

export const getDashboardStats = async () => {
  // TODO: Implement dashboard stats API call
  return { data: {} };
};

export const dashboardApi = {
  getShopDashboard: async (shopId: string): Promise<APIResponse<ShopDashboardData>> => {
    return apiClient.get(`/dashboard/shop/${shopId}`);
  },
  getShopDashboardSummary: async (shopId: string): Promise<APIResponse<DashboardSummary>> => {
    return apiClient.get(`/dashboard/shop/${shopId}/summary`);
  },
  getShopDashboardAlerts: async (shopId: string): Promise<APIResponse<DashboardAlert[]>> => {
    return apiClient.get(`/dashboard/shop/${shopId}/alerts`);
  },
  getHealthCheck: async (): Promise<APIResponse<HealthStatus>> => {
    return apiClient.get('/dashboard/health');
  },
};




// System stats

// Performance data



// Revenue and trends

// System health
