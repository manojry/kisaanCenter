


import type { Product } from '../types/api';
// Global cache for shop products by shopId (per session)
const shopProductsCache: { [shopId: number]: Product[] } = {};

export function useShopProductsCache() {
  // Returns a getter/setter for the cache
  const getShopProducts = (shopId: number): Product[] => shopProductsCache[shopId] || [];
  const setShopProducts = (shopId: number, products: Product[]) => {
    shopProductsCache[shopId] = products;
  };
  const invalidateShopProducts = (shopId: number) => {
    delete shopProductsCache[shopId];
  };
  return { getShopProducts, setShopProducts, invalidateShopProducts };
}
