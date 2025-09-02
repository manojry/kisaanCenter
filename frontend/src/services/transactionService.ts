
import { apiClient } from './api'
import { Transaction, TransactionFormData, TransactionFilters, TransactionAnalytics } from '@/types/transaction'

export interface TransactionListResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

class TransactionService {
  private baseUrl = '/api/v1/transactions'

  async getTransactions(params: TransactionFilters & { page: number; limit: number }): Promise<TransactionListResponse> {
    const response = await apiClient.get(this.baseUrl, { params });
    if (response && Array.isArray(response.data)) {
      return { transactions: response.data, pagination: { page: 1, limit: response.data.length, total: response.data.length, totalPages: 1 } };
    }
    if (response && response.data && Array.isArray(response.data.data)) {
      return { transactions: response.data.data, pagination: { page: 1, limit: response.data.data.length, total: response.data.data.length, totalPages: 1 } };
    }
    return response.data;
  }

  async getTransaction(id: number): Promise<Transaction> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  }

  async createTransaction(data: TransactionFormData): Promise<Transaction> {
    const response = await apiClient.post(this.baseUrl, data);
    if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  }

  async updateTransaction(id: number, data: TransactionFormData): Promise<Transaction> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, data);
    if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  }

  async deleteTransaction(id: number): Promise<void> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    // No return value needed
  }

  async updatePayment(id: number, paymentData: { amount: number }): Promise<Transaction> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/payment`, paymentData);
    if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  }

  async confirmCommission(id: number): Promise<Transaction> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/confirm-commission`);
    if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  }

  async getAnalytics(filters?: Partial<TransactionFilters>): Promise<TransactionAnalytics> {
    const response = await apiClient.get(`${this.baseUrl}/analytics`, { params: filters });
    if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  }

  async exportTransactions(filters?: TransactionFilters): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }

  async bulkUpdateStatus(ids: number[], status: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/bulk-status`, { ids, status });
  }

  async getTransactionsByUser(userId: number, params?: { page: number; limit: number }): Promise<TransactionListResponse> {
    const response = await apiClient.get(`/api/v1/users/${userId}/transactions`, { params });
    if (response && Array.isArray(response.data)) {
      return { transactions: response.data, pagination: { page: 1, limit: response.data.length, total: response.data.length, totalPages: 1 } };
    }
    if (response && response.data && Array.isArray(response.data.data)) {
      return { transactions: response.data.data, pagination: { page: 1, limit: response.data.data.length, total: response.data.data.length, totalPages: 1 } };
    }
    return response.data;
  }
}

export const transactionService = new TransactionService()
