

import { useState, useEffect, useCallback } from 'react';
import { shopProductsApi } from '../services/api';
import type { Product } from '../types/api';

interface ShopProductsCacheEntry {
  data: Product[] | null;
  timestamp: number;
  isLoading: boolean;
  error: string | null;
  subscribers: Set<() => void>;
}

// Global cache for shop products by shopId (per session)
const shopProductsCache: { [shopId: number]: ShopProductsCacheEntry } = {};
const TTL = 5 * 60 * 1000; // 5 minutes

function ensureCacheEntry(shopId: number) {
  if (!shopProductsCache[shopId]) {
    shopProductsCache[shopId] = {
      data: null,
      timestamp: 0,
      isLoading: false,
      error: null,
      subscribers: new Set(),
    };
  }
  return shopProductsCache[shopId];
}

export function useSharedShopProducts(shopId: number) {
  const [state, setState] = useState(() => {
    const entry = ensureCacheEntry(shopId);
    return {
      products: entry.data || [],
      isLoading: entry.isLoading,
      error: entry.error,
    };
  });

  useEffect(() => {
    const entry = ensureCacheEntry(shopId);
    const callback = () => {
      setState({
        products: entry.data || [],
        isLoading: entry.isLoading,
        error: entry.error,
      });
    };
    entry.subscribers.add(callback);
    return () => { entry.subscribers.delete(callback); };
  }, [shopId]);

  const fetchProducts = useCallback(async () => {
    const entry = ensureCacheEntry(shopId);
    if (entry.isLoading) return;
    entry.isLoading = true;
    entry.error = null;
    entry.subscribers.forEach(cb => cb());
    try {
      const rawProducts = await shopProductsApi.getShopProducts(shopId);
      // Map to ensure all required Product fields exist
      const products = (rawProducts || []).map((p: any) => ({
        ...p,
        name: p.name || p.product_name || '',
        product_name: p.product_name || p.name || '',
        category_id: p.category_id ?? (p.category?.id ?? 0),
        record_status: p.record_status ?? (typeof p.is_active === 'boolean' ? (p.is_active ? 'active' : 'inactive') : 'active'),
        created_at: p.created_at,
      }));
      entry.data = products;
      entry.timestamp = Date.now();
      entry.error = null;
    } catch (error) {
      let message = 'Failed to fetch products';
      if (error && typeof error === 'object' && 'message' in error) {
        message = (error as { message?: string }).message || message;
      }
      entry.error = message;
      entry.data = [];
    } finally {
      entry.isLoading = false;
      entry.subscribers.forEach(cb => cb());
    }
  }, [shopId]);

  useEffect(() => {
    const entry = ensureCacheEntry(shopId);
    if (!entry.data || (Date.now() - entry.timestamp) > TTL) {
      fetchProducts();
    }
  }, [shopId, fetchProducts]);

  return {
    products: state.products,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchProducts,
  };
}

export function invalidateShopProducts(shopId: number) {
  if (shopProductsCache[shopId]) {
    shopProductsCache[shopId].data = null;
    shopProductsCache[shopId].timestamp = 0;
    shopProductsCache[shopId].error = null;
    shopProductsCache[shopId].subscribers.forEach(cb => cb());
  }
}
