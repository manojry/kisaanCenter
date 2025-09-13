import { apiClient } from '../services/apiClient';

/**
 * Utility function to find a shop by owner ID with proper type handling
 */
export const findShopByOwnerId = (shops: any[], ownerId: string | number): any | null => {
  if (!Array.isArray(shops) || !ownerId) return null;
  
  return shops.find((shop: any) => {
    // Handle type mismatches between string and number IDs
    return shop.owner_id === ownerId || 
           shop.owner_id === Number(ownerId) || 
           Number(shop.owner_id) === Number(ownerId);
  }) || null;
};

/**
 * Fetch shop data for a specific owner
 */
export const fetchOwnerShop = async (ownerId: string | number): Promise<any | null> => {
  try {
    const response = await apiClient.get('/shops');
    const allShops = response?.data || response?.shops || [];
    return findShopByOwnerId(allShops, ownerId);
  } catch (error) {
    console.error('Error fetching owner shop:', error);
    throw error;
  }
};