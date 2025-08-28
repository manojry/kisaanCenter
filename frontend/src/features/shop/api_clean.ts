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
