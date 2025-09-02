import { apiClient } from '../../services/api';
import { APIResponse, FarmerStock, StockParams, AddStockData, UpdateStockData, StockSummary, StockAdjustment } from './types';

export const stockApi = {
  getFarmerStock: async (params?: StockParams): Promise<APIResponse<FarmerStock[]>> => {
    return apiClient.get('/farmer-stock/', params);
  },
  addFarmerStock: async (stockData: AddStockData): Promise<APIResponse<FarmerStock>> => {
    return apiClient.post('/farmer-stock/', stockData);
  },
  updateFarmerStock: async (stockId: number, updates: UpdateStockData): Promise<APIResponse<FarmerStock>> => {
    return apiClient.put(`/farmer-stock/${stockId}`, updates);
  },
  deleteFarmerStock: async (stockId: number): Promise<APIResponse<void>> => {
    return apiClient.delete(`/farmer-stock/${stockId}`);
  },
  getStockSummary: async (farmerId?: number): Promise<APIResponse<StockSummary>> => {
    return apiClient.get('/farmer-stock/summary', { farmer_id: farmerId });
  },
};

export async function fetchAdjustmentById(adjustmentId: string): Promise<StockAdjustment> {
  const response = await apiClient.get<StockAdjustment>(`/stock-adjustments/${adjustmentId}`);
  if (!response.data) throw new Error('No adjustment found');
  return response.data;
}
