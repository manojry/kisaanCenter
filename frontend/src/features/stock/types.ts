import { User } from '../user/types';
import { Product } from '../product/types';
import { Shop } from '../shop/types';

export enum StockStatus {
  PENDING = 'pending',
  AVAILABLE = 'available', 
  SOLD = 'sold',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
  RESERVED = 'reserved'
}

export enum AdjustmentType {
  INCREASE = 'increase',
  DECREASE = 'decrease',
  DAMAGE = 'damage',
  EXPIRE = 'expire',
  SALE = 'sale',
  RETURN = 'return'
}

export interface FarmerStock {
  id: string;
  shop_id: string;
  farmer_user_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  status: StockStatus;
  harvest_date: string;
  expiry_date?: string;
  location?: string;
  quality_grade?: 'A' | 'B' | 'C';
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
  // Relations
  farmer_user?: User;
  product?: Product;
  shop?: Shop;
}

export interface StockAdjustment {
  id: string;
  farmer_stock_id: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string;
  adjusted_by: string;
  date: string;
  created_at: string;
  updated_at: string;
  // Relations
  farmer_stock?: FarmerStock;
  adjusted_by_user?: User;
}

export interface CreateStockRequest {
  shop_id: string;
  farmer_user_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  harvest_date: string;
  expiry_date?: string;
  location?: string;
  quality_grade?: 'A' | 'B' | 'C';
  notes?: string;
}

export interface UpdateStockRequest {
  quantity?: number;
  unit_price?: number;
  status?: StockStatus;
  location?: string;
  quality_grade?: 'A' | 'B' | 'C';
  notes?: string;
}

export interface CreateAdjustmentRequest {
  farmer_stock_id: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string;
}

export interface StockSummary {
  total_products: number;
  total_quantity: number;
  available_quantity: number;
  sold_quantity: number;
  expired_quantity: number;
  damaged_quantity: number;
  total_value: number;
  available_value: number;
}

export interface StockFilter {
  shop_id?: string;
  farmer_user_id?: string;
  product_id?: string;
  status?: StockStatus;
  location?: string;
  quality_grade?: 'A' | 'B' | 'C';
  min_quantity?: number;
  max_quantity?: number;
  min_price?: number;
  max_price?: number;
  date_from?: string;
  date_to?: string;
}
