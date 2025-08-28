import { 
  DashboardStats, 
  OwnerDashboard, 
  FarmerDashboard, 
  BuyerDashboard, 
  EmployeeDashboard, 
  SuperAdminDashboard,
  ProductPerformance,
  ShopPerformance,
  UserActivity,
  RevenueData,
  SystemHealth
} from './types';
import { apiClient } from '../../services/api';

// Role-based dashboard data
export async function getOwnerDashboard(shopId: string): Promise<OwnerDashboard> {
  const response = await apiClient.get<OwnerDashboard>(`/dashboard/owner/${shopId}`);
  if (!response.data) throw new Error('Failed to get owner dashboard data');
  return response.data;
}

export async function getFarmerDashboard(farmerId: string): Promise<FarmerDashboard> {
  const response = await apiClient.get<FarmerDashboard>(`/dashboard/farmer/${farmerId}`);
  if (!response.data) throw new Error('Failed to get farmer dashboard data');
  return response.data;
}

export async function getBuyerDashboard(buyerId: string): Promise<BuyerDashboard> {
  const response = await apiClient.get<BuyerDashboard>(`/dashboard/buyer/${buyerId}`);
  if (!response.data) throw new Error('Failed to get buyer dashboard data');
  return response.data;
}

export async function getEmployeeDashboard(employeeId: string): Promise<EmployeeDashboard> {
  const response = await apiClient.get<EmployeeDashboard>(`/dashboard/employee/${employeeId}`);
  if (!response.data) throw new Error('Failed to get employee dashboard data');
  return response.data;
}

export async function getSuperAdminDashboard(): Promise<SuperAdminDashboard> {
  const response = await apiClient.get<SuperAdminDashboard>('/dashboard/superadmin');
  if (!response.data) throw new Error('Failed to get super admin dashboard data');
  return response.data;
}

// System stats
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>('/dashboard/stats');
  if (!response.data) throw new Error('Failed to get dashboard stats');
  return response.data;
}

// Performance data
export async function getProductPerformance(shopId?: string, limit = 10): Promise<ProductPerformance[]> {
  const url = shopId 
    ? `/dashboard/product-performance?shop_id=${shopId}&limit=${limit}` 
    : `/dashboard/product-performance?limit=${limit}`;
  const response = await apiClient.get<ProductPerformance[]>(url);
  if (!response.data) throw new Error('Failed to get product performance data');
  return response.data;
}

export async function getShopPerformance(limit = 10): Promise<ShopPerformance[]> {
  const response = await apiClient.get<ShopPerformance[]>(`/dashboard/shop-performance?limit=${limit}`);
  if (!response.data) throw new Error('Failed to get shop performance data');
  return response.data;
}

export async function getUserActivity(limit = 20): Promise<UserActivity[]> {
  const response = await apiClient.get<UserActivity[]>(`/dashboard/user-activity?limit=${limit}`);
  if (!response.data) throw new Error('Failed to get user activity data');
  return response.data;
}

// Revenue and trends
export async function getRevenueTrends(shopId?: string, days = 30): Promise<RevenueData[]> {
  const url = shopId 
    ? `/dashboard/revenue-trends?shop_id=${shopId}&days=${days}` 
    : `/dashboard/revenue-trends?days=${days}`;
  const response = await apiClient.get<RevenueData[]>(url);
  if (!response.data) throw new Error('Failed to get revenue trends data');
  return response.data;
}

// System health
export async function getSystemHealth(): Promise<SystemHealth> {
  const response = await apiClient.get<SystemHealth>('/dashboard/system-health');
  if (!response.data) throw new Error('Failed to get system health data');
  return response.data;
}
