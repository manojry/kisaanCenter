import { 
  FarmerStock, 
  StockAdjustment, 
  CreateStockRequest, 
  UpdateStockRequest, 
  CreateAdjustmentRequest,
  StockSummary,
  StockFilter 
} from './types';
import { apiClient } from '../../services/api';

// Stock management functions
export async function fetchFarmerStock(filter?: StockFilter): Promise<FarmerStock[]> {
  const params = new URLSearchParams();
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  const url = params.toString() ? `/farmer-stock?${params.toString()}` : '/farmer-stock';
  const response = await apiClient.get<FarmerStock[]>(url);
  if (!response.data) throw new Error('No farmer stock data returned');
  return response.data;
}

export async function fetchFarmerStockById(stockId: string): Promise<FarmerStock> {
  const response = await apiClient.get<FarmerStock>(`/farmer-stock/${stockId}`);
  if (!response.data) throw new Error('No farmer stock found');
  return response.data;
}

export async function fetchStockByFarmer(farmerId: string): Promise<FarmerStock[]> {
  const response = await apiClient.get<FarmerStock[]>(`/farmer-stock/farmer/${farmerId}`);
  if (!response.data) throw new Error('No farmer stock data returned');
  return response.data;
}

export async function fetchAvailableStock(shopId: string): Promise<FarmerStock[]> {
  const response = await apiClient.get<FarmerStock[]>(`/farmer-stock/available?shop_id=${shopId}`);
  if (!response.data) throw new Error('No available stock found');
  return response.data;
}

export async function fetchStocksByProduct(productId: string, shopId?: string): Promise<FarmerStock[]> {
  const url = shopId 
    ? `/farmer-stock/product/${productId}?shop_id=${shopId}` 
    : `/farmer-stock/product/${productId}`;
  const response = await apiClient.get<FarmerStock[]>(url);
  if (!response.data) throw new Error('No stock data returned');
  return response.data;
}

export async function createFarmerStock(stockData: CreateStockRequest): Promise<FarmerStock> {
  const response = await apiClient.post<FarmerStock>('/farmer-stock', stockData);
  if (!response.data) throw new Error('Failed to create farmer stock');
  return response.data;
}

export async function updateFarmerStock(stockId: string, stockData: UpdateStockRequest): Promise<FarmerStock> {
  const response = await apiClient.put<FarmerStock>(`/farmer-stock/${stockId}`, stockData);
  if (!response.data) throw new Error('Failed to update farmer stock');
  return response.data;
}

export async function deleteFarmerStock(stockId: string): Promise<void> {
  await apiClient.delete<void>(`/farmer-stock/${stockId}`);
}

export async function adjustStock(stockId: string, adjustmentData: CreateAdjustmentRequest): Promise<FarmerStock> {
  const response = await apiClient.post<FarmerStock>(`/farmer-stock/${stockId}/adjust`, adjustmentData);
  if (!response.data) throw new Error('Failed to adjust stock');
  return response.data;
}

export async function getStockSummary(farmerId?: string, shopId?: string): Promise<StockSummary> {
  const params = new URLSearchParams();
  if (farmerId) params.append('farmer_id', farmerId);
  if (shopId) params.append('shop_id', shopId);
  const url = params.toString() 
    ? `/farmer-stock/summary?${params.toString()}` 
    : '/farmer-stock/summary';
  const response = await apiClient.get<StockSummary>(url);
  if (!response.data) throw new Error('Failed to get stock summary');
  return response.data;
}

// Stock adjustment functions
export async function fetchStockAdjustments(stockId?: string): Promise<StockAdjustment[]> {
  const url = stockId ? `/stock-adjustments?stock_id=${stockId}` : '/stock-adjustments';
  const response = await apiClient.get<StockAdjustment[]>(url);
  if (!response.data) throw new Error('No adjustment data returned');
  return response.data;
}

export async function createStockAdjustment(adjustmentData: CreateAdjustmentRequest): Promise<StockAdjustment> {
  const response = await apiClient.post<StockAdjustment>('/stock-adjustments', adjustmentData);
  if (!response.data) throw new Error('Failed to create stock adjustment');
  return response.data;
}

export async function fetchAdjustmentById(adjustmentId: string): Promise<StockAdjustment> {
  const response = await apiClient.get<StockAdjustment>(`/stock-adjustments/${adjustmentId}`);
  if (!response.data) throw new Error('No adjustment found');
  return response.data;
}
