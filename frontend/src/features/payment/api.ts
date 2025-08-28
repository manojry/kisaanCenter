import { Payment } from './types';
import { apiClient } from '../../services/api';

export async function fetchAllPayments(): Promise<Payment[]> {
  const response = await apiClient.get<Payment[]>('/payments');
  if (!response.data) throw new Error('No payment data returned');
  return response.data;
}

export async function fetchPaymentById(paymentId: string): Promise<Payment> {
  const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
  if (!response.data) throw new Error('No payment found');
  return response.data;
}

export async function createPayment(paymentData: Partial<Payment>): Promise<Payment> {
  const response = await apiClient.post<Payment>('/payments', paymentData);
  if (!response.data) throw new Error('Failed to create payment');
  return response.data;
}

export async function updatePayment(paymentId: string, paymentData: Partial<Payment>): Promise<Payment> {
  const response = await apiClient.put<Payment>(`/payments/${paymentId}`, paymentData);
  if (!response.data) throw new Error('Failed to update payment');
  return response.data;
}

export async function deletePayment(paymentId: string): Promise<void> {
  await apiClient.delete<void>(`/payments/${paymentId}`);
}

export async function fetchPaymentsByTransaction(transactionId: string): Promise<Payment[]> {
  const response = await apiClient.get<Payment[]>(`/transactions/${transactionId}/payments`);
  if (!response.data) throw new Error('No payments found for transaction');
  return response.data;
}

export async function fetchPaymentsByUser(userId: string): Promise<Payment[]> {
  const response = await apiClient.get<Payment[]>(`/users/${userId}/payments`);
  if (!response.data) throw new Error('No payments found for user');
  return response.data;
}
