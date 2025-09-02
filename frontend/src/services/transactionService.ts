
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
  success: boolean;
  data: T;
  message?: string;
}

class TransactionService {
  private baseUrl = '/api/v1/transactions'

  async getTransactions(params: TransactionFilters & { page: number; limit: number }): Promise<TransactionListResponse> {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(this.baseUrl, { params });
    if (response?.data?.data && Array.isArray(response.data.data)) {
      return {
        transactions: response.data.data,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: response.data.data.length,
          totalPages: 1
        }
      };
    }
    throw new Error('Invalid response from backend');
  }

  async getTransaction(id: number): Promise<Transaction> {
    const response = await apiClient.get<ApiResponse<Transaction>>(`${this.baseUrl}/${id}`);
    if (response?.data?.data) {
      return response.data.data;
    }
    throw new Error('Invalid response from backend');
  }

  async createTransaction(data: TransactionFormData): Promise<Transaction> {
    const response = await apiClient.post<ApiResponse<Transaction>>(this.baseUrl, data);
    if (response?.data?.data) {
      return response.data.data;
    }
    throw new Error('Invalid response from backend');
  }

  async updateTransaction(id: number, data: TransactionFormData): Promise<Transaction> {
    const response = await apiClient.put<ApiResponse<Transaction>>(`${this.baseUrl}/${id}`, data);
    if (response?.data?.data) {
      return response.data.data;
    }
    throw new Error('Invalid response from backend');
  }

  async deleteTransaction(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async updatePayment(id: number, paymentData: { amount: number }): Promise<Transaction> {
    const response = await apiClient.put<ApiResponse<Transaction>>(`${this.baseUrl}/${id}/payment`, paymentData);
    if (response?.data?.data) {
      return response.data.data;
    }
    throw new Error('Invalid response from backend');
  }

  async confirmCommission(id: number): Promise<Transaction> {
    const response = await apiClient.post<ApiResponse<Transaction>>(`${this.baseUrl}/${id}/confirm-commission`);
    if (response?.data?.data) {
      return response.data.data;
    }
    throw new Error('Invalid response from backend');
  }

  async getAnalytics(filters?: Partial<TransactionFilters>): Promise<TransactionAnalytics> {
    const response = await apiClient.get<ApiResponse<TransactionAnalytics>>(`${this.baseUrl}/analytics`, { params: filters });
    if (response?.data?.data) {
      return response.data.data;
    }
    throw new Error('Invalid response from backend');
  }

  async exportTransactions(filters?: TransactionFilters): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data as Blob;
  }

  async bulkUpdateStatus(ids: number[], status: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/bulk-status`, { ids, status });
  }

  async getTransactionsByUser(userId: number, params?: { page: number; limit: number }): Promise<TransactionListResponse> {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(`/api/v1/users/${userId}/transactions`, { params });
    if (response?.data?.data && Array.isArray(response.data.data)) {
      return {
        transactions: response.data.data,
        pagination: {
          page: params?.page ?? 1,
          limit: params?.limit ?? response.data.data.length,
          total: response.data.data.length,
          totalPages: 1
        }
      };
    }
    throw new Error('Invalid response from backend');
  }
}

export const transactionService = new TransactionService()
