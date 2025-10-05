import { apiClient } from './apiClient';

export const creditAdvanceApi = {
  getAll: async () => {
    const res = await apiClient.get<{ data?: unknown[] } | unknown[]>('/credits');
    if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as { data?: unknown[] }).data)) return (res as { data?: unknown[] }).data;
    if (Array.isArray(res)) return res;
    return [];
  },
  issue: async (payload: { user_id: string; shop_id: string; amount: number; issued_date: string; due_date: string }) => {
    return apiClient.post('/credits/issue', payload);
  },
  repay: async (payload: { credit_id: number; amount: number }) => {
    return apiClient.post('/credits/repay', payload);
  },
};