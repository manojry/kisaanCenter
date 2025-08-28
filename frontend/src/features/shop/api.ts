import { Shop } from './types';
import { apiClient } from '../../services/api';

export async function fetchAllShops(): Promise<Shop[]> {
  const response = await apiClient.get<Shop[]>('/shops');
  if (!response.data) throw new Error('No shop data returned');
  return response.data;
}

export async function fetchShopById(shopId: string): Promise<Shop> {
  const response = await apiClient.get<Shop>(`/shops/${shopId}`);
  if (!response.data) throw new Error('No shop found');
  return response.data;
}

export async function createShop(shopData: Partial<Shop>): Promise<Shop> {
  const response = await apiClient.post<Shop>('/shops', shopData);
  if (!response.data) throw new Error('Failed to create shop');
  return response.data;
}

export async function updateShop(shopId: string, shopData: Partial<Shop>): Promise<Shop> {
  const response = await apiClient.put<Shop>(`/shops/${shopId}`, shopData);
  if (!response.data) throw new Error('Failed to update shop');
  return response.data;
}

export async function deleteShop(shopId: string): Promise<void> {
  await apiClient.delete<void>(`/shops/${shopId}`);
}

// Plan Management APIs
export interface PlanAssignmentRequest {
  plan_id: number;
  billing_cycle?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  superadmin_id?: number;
}

export async function assignPlanToShop(shopId: number, request: PlanAssignmentRequest): Promise<any> {
  const queryParams = new URLSearchParams();
  Object.entries(request).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, String(value));
  });
  
  const response = await apiClient.post(`/shops/${shopId}/plan?${queryParams.toString()}`);
  return response.data;
}

export async function upgradePlan(shopId: number, planId: number, reason?: string): Promise<any> {
  return assignPlanToShop(shopId, {
    plan_id: planId,
    billing_cycle: 'monthly',
    reason: reason || 'Plan upgrade'
  });
}

export async function downgradePlan(shopId: number, planId: number, reason?: string): Promise<any> {
  return assignPlanToShop(shopId, {
    plan_id: planId,
    billing_cycle: 'monthly',
    reason: reason || 'Plan downgrade'
  });
}
