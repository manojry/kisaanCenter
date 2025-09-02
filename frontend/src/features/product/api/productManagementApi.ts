
import { apiClient } from '@/services/api';

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  description?: string;
  unit: string;
  is_active: boolean;
}

export interface ShopProductSetupRequest {
  selected_product_ids: number[];
}

export interface ProductAssignmentItem {
  shop_product_id: number;
  preferred_price?: number;
  notes?: string;
}

export interface FarmerProductAssignmentRequest {
  product_assignments: ProductAssignmentItem[];
}

export const productManagementApi = {
  // Get all categories (for superadmin)
  getAllCategories: async () => {
    return apiClient.get('/api/v1/product-management/categories');
  },

  // Get all products (for owner selection)
  getAllProducts: async (categoryId?: number) => {
    const params = categoryId ? { category_id: categoryId } : {};
    return apiClient.get('/api/v1/product-management/products/all', { params });
  },

  // Setup shop products (owner selects what to sell)
  setupShopProducts: async (shopId: number, request: ShopProductSetupRequest) => {
    return apiClient.post(`/api/v1/product-management/shop/${shopId}/products/setup`, request);
  },

  // Get shop's product catalog
  getShopCatalog: async (shopId: number) => {
    return apiClient.get(`/api/v1/product-management/shop/${shopId}/products/catalog`);
  },

  // Assign products to farmer
  assignFarmerProducts: async (farmerId: number, request: FarmerProductAssignmentRequest) => {
    return apiClient.post(`/api/v1/product-management/farmer/${farmerId}/products/assign`, request);
  },

  // Get farmer's available products (for transaction entry)
  getFarmerAvailableProducts: async (farmerId: number) => {
    return apiClient.get(`/api/v1/product-management/farmer/${farmerId}/products/available`);
  },

  // Get farmers-products summary for shop
  getFarmersProductsSummary: async (shopId: number) => {
    return apiClient.get(`/api/v1/product-management/shop/${shopId}/farmers-products/summary`);
  }
};
