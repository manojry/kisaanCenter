import { Credit } from './types';
import { apiClient } from '../../services/api';

export async function fetchAllCredits(): Promise<Credit[]> {
  const response = await apiClient.get<Credit[]>('/credits');
  if (!response.data) throw new Error('No credit data returned');
  return response.data;
}

export async function fetchCreditById(creditId: string): Promise<Credit> {
  const response = await apiClient.get<Credit>(`/credits/${creditId}`);
  if (!response.data) throw new Error('No credit found');
  return response.data;
}

export async function createCredit(creditData: Partial<Credit>): Promise<Credit> {
  const response = await apiClient.post<Credit>('/credits', creditData);
  if (!response.data) throw new Error('Failed to create credit');
  return response.data;
}

export async function updateCredit(creditId: string, creditData: Partial<Credit>): Promise<Credit> {
  const response = await apiClient.put<Credit>(`/credits/${creditId}`, creditData);
  if (!response.data) throw new Error('Failed to update credit');
  return response.data;
}

export async function deleteCredit(creditId: string): Promise<void> {
  await apiClient.delete<void>(`/credits/${creditId}`);
}
