import { useQuery } from 'react-query';
import { fetchAllProducts } from '../api';
import { Product } from '../types';

export function useProducts() {
  return useQuery<Product[], Error>('products', fetchAllProducts);
}
