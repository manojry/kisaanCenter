
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export const useDashboardCache = <T>(defaultTTL: number = 5 * 60 * 1000) => {
  const [cache, setCache] = useLocalStorage<Record<string, CacheEntry<T>>>('dashboard-cache', {});

  const get = useCallback((key: string): T | null => {
    const entry = cache[key];
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Entry expired, remove it
      const newCache = { ...cache };
      delete newCache[key];
      setCache(newCache);
      return null;
    }

    return entry.data;
  }, [cache, setCache]);

  const set = useCallback((key: string, data: T, ttl: number = defaultTTL) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    setCache(prev => ({
      ...prev,
      [key]: entry,
    }));
  }, [setCache, defaultTTL]);

  const clear = useCallback((key?: string) => {
    if (key) {
      const newCache = { ...cache };
      delete newCache[key];
      setCache(newCache);
    } else {
      setCache({});
    }
  }, [cache, setCache]);

  const clearExpired = useCallback(() => {
    const now = Date.now();
    const newCache = Object.entries(cache).reduce((acc, [key, entry]) => {
      if (now - entry.timestamp <= entry.ttl) {
        acc[key] = entry;
      }
      return acc;
    }, {} as Record<string, CacheEntry<T>>);

    setCache(newCache);
  }, [cache, setCache]);

  return { get, set, clear, clearExpired };
};
