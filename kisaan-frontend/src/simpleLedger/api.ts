// API utility for simple ledger (uses centralized apiClient)
import { apiClient } from '../services/apiClient';

export async function fetchLedgerEntries(shopId: number, farmerId?: number) {
  const qs = `?shop_id=${encodeURIComponent(String(shopId))}${farmerId ? `&farmer_id=${encodeURIComponent(String(farmerId))}` : ''}`;
  return apiClient.get(`/simple-ledger${qs}`);
}

export async function createLedgerEntry(data: {
  shop_id: number;
  farmer_id: number;
  type: string;
  category: string;
  amount: number;
  notes?: string;
  created_by?: number;
}) {
  return apiClient.post('/simple-ledger', data);
}

export async function fetchLedgerSummary(shopId: number, period?: 'weekly' | 'monthly') {
  const params = new URLSearchParams();
  params.append('shop_id', String(shopId));
  if (period) params.append('period', period);
  const qs = `?${params.toString()}`;
  return apiClient.get(`/simple-ledger/summary${qs}`);
}
