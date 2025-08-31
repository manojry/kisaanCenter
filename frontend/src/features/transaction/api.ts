import { Transaction, CreateTransactionRequest, UpdateTransactionRequest, TransactionSummary } from './types';
import { apiClient } from '../../services/api';

export async function fetchAllTransactions(shopId?: string): Promise<Transaction[]> {
  const params = shopId ? { shop_id: shopId } : {};
  const response = await apiClient.get<Transaction[]>('/transactions', { params });
  if (!response.data) throw new Error('No transaction data returned');
  return response.data;
}

export async function fetchTransactionById(transactionId: string): Promise<Transaction> {
  const response = await apiClient.get<Transaction>(`/transactions/${transactionId}`);
  if (!response.data) throw new Error('No transaction found');
  return response.data;
}

export async function fetchTransactionsByShop(shopId: string): Promise<Transaction[]> {
  const response = await apiClient.get<Transaction[]>(`/shops/${shopId}/transactions`);
  if (!response.data) throw new Error('No transaction data returned');
  return response.data;
}

export async function fetchTransactionsByBuyer(buyerId: string): Promise<Transaction[]> {
  const response = await apiClient.get<Transaction[]>(`/users/${buyerId}/transactions`);
  if (!response.data) throw new Error('No transaction data returned');
  return response.data;
}

export async function createTransaction(transactionData: CreateTransactionRequest): Promise<Transaction> {
  const response = await apiClient.post<Transaction>('/transactions', transactionData);
  if (!response.data) throw new Error('Failed to create transaction');
  return response.data;
}

export async function updateTransaction(transactionId: string, transactionData: UpdateTransactionRequest): Promise<Transaction> {
  const response = await apiClient.put<Transaction>(`/transactions/${transactionId}`, transactionData);
  if (!response.data) throw new Error('Failed to update transaction');
  return response.data;
}

export async function completeTransaction(transactionId: string): Promise<Transaction> {
  const response = await apiClient.post<Transaction>(`/transactions/${transactionId}/complete`);
  if (!response.data) throw new Error('Failed to complete transaction');
  return response.data;
}

export async function cancelTransaction(transactionId: string): Promise<Transaction> {
  const response = await apiClient.post<Transaction>(`/transactions/${transactionId}/cancel`);
  if (!response.data) throw new Error('Failed to cancel transaction');
  return response.data;
}

export async function getTransactionSummary(shopId?: string): Promise<TransactionSummary> {
  const url = shopId ? `/transactions/summary?shop_id=${shopId}` : '/transactions/summary';
  const response = await apiClient.get<TransactionSummary>(url);
  if (!response.data) throw new Error('Failed to get transaction summary');
  return response.data;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  await apiClient.delete<void>(`/transactions/${transactionId}`);
}
