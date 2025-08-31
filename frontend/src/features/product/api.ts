
import { Product } from './types';
import { apiClient } from '../../services/api';

export async function fetchAllProducts(shopId?: number): Promise<Product[]> {
  const params = shopId ? { shop_id: shopId } : {};
  const response = await apiClient.get<Product[]>('/products', { params });
  if (!response.data) throw new Error('No product data returned');
  return response.data;
}

export async function fetchProductById(productId: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${productId}`);
  if (!response.data) throw new Error('No product found');
  return response.data;
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const response = await apiClient.post<Product>('/products', productData);
  if (!response.data) throw new Error('Failed to create product');
  return response.data;
}

export async function updateProduct(productId: string, productData: Partial<Product>): Promise<Product> {
  const response = await apiClient.put<Product>(`/products/${productId}`, productData);
  if (!response.data) throw new Error('Failed to update product');
  return response.data;
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiClient.delete<void>(`/products/${productId}`);
}
