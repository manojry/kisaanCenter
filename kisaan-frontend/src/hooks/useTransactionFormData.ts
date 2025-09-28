import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';

interface Entity { id: number; username?: string; name?: string; }

interface UseTransactionFormDataResult {
  farmers: Entity[];
  buyers: Entity[];
  products: Entity[];
  categories: Entity[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTransactionFormData(): UseTransactionFormDataResult {
  console.log('useTransactionFormData hook mounted');
  const [farmers, setFarmers] = useState<Entity[]>([]);
  const [buyers, setBuyers] = useState<Entity[]>([]);
  const [products, setProducts] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (farmers.length > 0) {
      console.log('Farmers loaded:', farmers);
    }
    if (buyers.length > 0) {
      console.log('Buyers loaded:', buyers);
    }
    if (products.length > 0) {
      console.log('Products loaded:', products);
    }
    if (categories.length > 0) {
      console.log('Categories loaded:', categories);
    }
  }, [farmers, buyers, products, categories]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      setError('Data loading timed out. Please refresh the page.');
      setIsLoading(false);
    }, 8000); // 8 seconds timeout
    console.log('fetchAll called');
    try {
      console.log('Starting fetch...');
      const [farmersRes, buyersRes, productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/users?role=farmer') as any,
        apiClient.get('/users?role=buyer') as any,
        apiClient.get('/products') as any,
        apiClient.get('/categories') as any,
      ]);
      console.log('Fetch completed');
      if (!didTimeout) {
        // Log raw API responses for debugging
        console.log('RAW farmersRes:', farmersRes);
        console.log('RAW buyersRes:', buyersRes);
        console.log('RAW productsRes:', productsRes);
        console.log('RAW categoriesRes:', categoriesRes);

        setFarmers(Array.isArray(farmersRes?.data) ? farmersRes.data : Array.isArray(farmersRes) ? farmersRes : []);
        setBuyers(Array.isArray(buyersRes?.data) ? buyersRes.data : Array.isArray(buyersRes) ? buyersRes : []);
        setProducts(Array.isArray(productsRes?.data) ? productsRes.data : Array.isArray(productsRes) ? productsRes : []);
        setCategories(Array.isArray(categoriesRes?.data) ? categoriesRes.data : Array.isArray(categoriesRes) ? categoriesRes : []);
      }
    } catch (e: any) {
      console.log('Error in fetchAll:', e);
      if (!didTimeout) {
        setError(e?.message || 'Failed to load form data');
      }
    } finally {
      if (!didTimeout) {
        setIsLoading(false);
      }
      clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { farmers, buyers, products, categories, isLoading, error, refetch: fetchAll };
}

export default useTransactionFormData;
