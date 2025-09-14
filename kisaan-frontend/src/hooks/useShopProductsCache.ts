import { useRef } from 'react';

// Global cache for shop products by shopId (per session)
const shopProductsCache: { [shopId: number]: any[] } = {};

export function useShopProductsCache() {
  // Returns a getter/setter for the cache
  const getShopProducts = (shopId: number) => shopProductsCache[shopId];
  const setShopProducts = (shopId: number, products: any[]) => {
    shopProductsCache[shopId] = products;
  };
  const invalidateShopProducts = (shopId: number) => {
    delete shopProductsCache[shopId];
  };
  return { getShopProducts, setShopProducts, invalidateShopProducts };
}
