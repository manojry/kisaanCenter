import { useQuery } from 'react-query';
import { fetchAllProducts } from '../api';
import { Product } from '../types';

export function useProducts(shopId?: number) {
  return useQuery<Product[], Error>(
    ['products', shopId], 
    () => fetchAllProducts(shopId),
    {
      enabled: !!shopId
    }
  );
}
