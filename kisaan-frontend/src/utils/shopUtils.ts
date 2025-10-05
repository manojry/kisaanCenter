import { apiClient } from '../services/apiClient';
import type { Shop } from '../types/api';

/**
 * Utility function to find a shop by owner ID with proper type handling
 */
export const findShopByOwnerId = (shops: Shop[], ownerId: string | number): Shop | null => {
  if (!Array.isArray(shops) || !ownerId) return null;
  return shops.find((shop: Shop) => {
    // Handle type mismatches between string and number IDs
    return shop.owner_id === ownerId || 
           shop.owner_id === Number(ownerId) || 
           Number(shop.owner_id) === Number(ownerId);
  }) || null;
};

/**
 * Fetch shop data for a specific owner
 */
export const fetchOwnerShop = async (ownerId: string | number): Promise<Shop | null> => {
  try {
    const response = await apiClient.get<{ data?: Shop[]; shops?: Shop[] }>('/shops');
    const allShops: Shop[] = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.shops)
        ? response.shops
        : [];
    return findShopByOwnerId(allShops, ownerId);
  } catch (error) {
    console.error('Error fetching owner shop:', error);
    throw error;
  }
};