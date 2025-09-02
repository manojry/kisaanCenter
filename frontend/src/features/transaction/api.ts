import { apiClient } from '../../services/api';
import { APIResponse, CreateTransactionData, Transaction, TransactionParams, TransactionSummary, IncompleteTransaction, TransactionDashboard } from './types';

export const transactionApi = {
  createTransaction: async (transactionData: CreateTransactionData): Promise<APIResponse<Transaction>> => {
    return apiClient.post('/transactions/', transactionData);
  },
  getTransactions: async (params?: TransactionParams): Promise<APIResponse<Transaction[]>> => {
    return apiClient.get('/transactions/', params);
  },
  getTransactionById: async (transactionId: number): Promise<APIResponse<Transaction>> => {
    return apiClient.get(`/transactions/${transactionId}`);
  },
  confirmCommission: async (transactionId: number): Promise<APIResponse<Transaction>> => {
    return apiClient.put(`/transactions/${transactionId}/confirm-commission`);
  },
  getTransactionSummary: async (transactionId: number): Promise<APIResponse<TransactionSummary>> => {
    return apiClient.get(`/transactions/${transactionId}/summary`);
  },
  getIncompleteTransactions: async (shopId?: number): Promise<APIResponse<IncompleteTransaction[]>> => {
    return apiClient.get('/transactions/completion-status/pending', { shop_id: shopId });
  },
  getShopTransactionDashboard: async (shopId: number): Promise<APIResponse<TransactionDashboard>> => {
    return apiClient.get(`/transactions/shop/${shopId}/dashboard`);
  },
};
