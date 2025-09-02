
import { apiClient } from '@/services/api';
import { Transaction } from '@/types/entities';

export interface TransactionFilters {
  shop_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  farmer_id?: number;
  buyer_id?: number;
  page?: number;
  limit?: number;
}

export interface IncompleteTransaction {
  id: number;
  action_required: 'buyer_payment' | 'farmer_payment' | 'commission';
  total_amount: number;
  date: string;
  created_at: string;
  farmer_name?: string;
  buyer_name?: string;
}

export const transactionApi = {
  async getTransactions(filters: TransactionFilters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await apiClient.get<Transaction[]>(`/transactions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  },

  async getIncompleteTransactions(shopId: number) {
    try {
      const response = await apiClient.get<IncompleteTransaction[]>(`/shops/${shopId}/transactions/incomplete`);
      return response;
    } catch (error) {
      console.error('Failed to fetch incomplete transactions:', error);
      throw error;
    }
  },

  async createTransaction(transactionData: Partial<Transaction>) {
    try {
      const response = await apiClient.post<Transaction>('/transactions', transactionData);
      return response;
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  },

  async updateTransaction(id: number, updates: Partial<Transaction>) {
    try {
      const response = await apiClient.put<Transaction>(`/transactions/${id}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  },

  async deleteTransaction(id: number) {
    try {
      const response = await apiClient.delete(`/transactions/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  },
};
