

// Global cache for shop products by shopId (per session)
const shopProductsCache: { [shopId: number]: Record<string, unknown>[] } = {};

export function useShopProductsCache() {
  // Returns a getter/setter for the cache
  const getShopProducts = (shopId: number) => shopProductsCache[shopId];
  const setShopProducts = (shopId: number, products: Record<string, unknown>[]) => {
    shopProductsCache[shopId] = products;
  };
  const invalidateShopProducts = (shopId: number) => {
    delete shopProductsCache[shopId];
  };
  return { getShopProducts, setShopProducts, invalidateShopProducts };
}
