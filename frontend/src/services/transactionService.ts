
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
    const response = await apiClient.get(this.baseUrl, { params })
    return response.data
  }

  async getTransaction(id: number): Promise<Transaction> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`)
    return response.data
  }

  async createTransaction(data: TransactionFormData): Promise<Transaction> {
    const response = await apiClient.post(this.baseUrl, data)
    return response.data
  }

  async updateTransaction(id: number, data: TransactionFormData): Promise<Transaction> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  async deleteTransaction(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  async updatePayment(id: number, paymentData: { amount: number }): Promise<Transaction> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/payment`, paymentData)
    return response.data
  }

  async confirmCommission(id: number): Promise<Transaction> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/confirm-commission`)
    return response.data
  }

  async getAnalytics(filters?: Partial<TransactionFilters>): Promise<TransactionAnalytics> {
    const response = await apiClient.get(`${this.baseUrl}/analytics`, { params: filters })
    return response.data
  }

  async exportTransactions(filters?: TransactionFilters): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      params: filters,
      responseType: 'blob'
    })
    return response.data
  }

  async bulkUpdateStatus(ids: number[], status: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/bulk-status`, { ids, status })
  }

  async getTransactionsByUser(userId: number, params?: { page: number; limit: number }): Promise<TransactionListResponse> {
    const response = await apiClient.get(`/api/v1/users/${userId}/transactions`, { params })
    return response.data
  }
}

export const transactionService = new TransactionService()
