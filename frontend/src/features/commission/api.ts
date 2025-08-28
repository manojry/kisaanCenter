import { 
  Commission, 
  CommissionRule, 
  CreateCommissionRuleRequest, 
  UpdateCommissionRuleRequest,
  CommissionCalculation,
  CommissionSummary,
  CommissionFilter
} from './types';
import { apiClient } from '../../services/api';

// Commission Rules Management
export async function fetchCommissionRules(shopId?: string): Promise<CommissionRule[]> {
  const url = shopId ? `/commission-rules?shop_id=${shopId}` : '/commission-rules';
  const response = await apiClient.get<CommissionRule[]>(url);
  if (!response.data) throw new Error('No commission rules found');
  return response.data;
}

export async function fetchCommissionRuleById(ruleId: string): Promise<CommissionRule> {
  const response = await apiClient.get<CommissionRule>(`/commission-rules/${ruleId}`);
  if (!response.data) throw new Error('Commission rule not found');
  return response.data;
}

export async function createCommissionRule(ruleData: CreateCommissionRuleRequest): Promise<CommissionRule> {
  const response = await apiClient.post<CommissionRule>('/commission-rules', ruleData);
  if (!response.data) throw new Error('Failed to create commission rule');
  return response.data;
}

export async function updateCommissionRule(ruleId: string, ruleData: UpdateCommissionRuleRequest): Promise<CommissionRule> {
  const response = await apiClient.put<CommissionRule>(`/commission-rules/${ruleId}`, ruleData);
  if (!response.data) throw new Error('Failed to update commission rule');
  return response.data;
}

export async function deleteCommissionRule(ruleId: string): Promise<void> {
  await apiClient.delete<void>(`/commission-rules/${ruleId}`);
}

export async function activateCommissionRule(ruleId: string): Promise<CommissionRule> {
  const response = await apiClient.post<CommissionRule>(`/commission-rules/${ruleId}/activate`);
  if (!response.data) throw new Error('Failed to activate commission rule');
  return response.data;
}

export async function deactivateCommissionRule(ruleId: string): Promise<CommissionRule> {
  const response = await apiClient.post<CommissionRule>(`/commission-rules/${ruleId}/deactivate`);
  if (!response.data) throw new Error('Failed to deactivate commission rule');
  return response.data;
}

// Commission Management
export async function fetchCommissions(filter?: CommissionFilter): Promise<Commission[]> {
  const params = new URLSearchParams();
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  const url = params.toString() ? `/commissions?${params.toString()}` : '/commissions';
  const response = await apiClient.get<Commission[]>(url);
  if (!response.data) throw new Error('No commission data returned');
  return response.data;
}

export async function fetchCommissionById(commissionId: string): Promise<Commission> {
  const response = await apiClient.get<Commission>(`/commissions/${commissionId}`);
  if (!response.data) throw new Error('Commission not found');
  return response.data;
}

export async function fetchCommissionsByTransaction(transactionId: string): Promise<Commission[]> {
  const response = await apiClient.get<Commission[]>(`/transactions/${transactionId}/commissions`);
  if (!response.data) throw new Error('No commission data returned');
  return response.data;
}

export async function fetchCommissionsByFarmer(farmerId: string): Promise<Commission[]> {
  const response = await apiClient.get<Commission[]>(`/users/${farmerId}/commissions`);
  if (!response.data) throw new Error('No commission data returned');
  return response.data;
}

export async function confirmCommission(commissionId: string, notes?: string): Promise<Commission> {
  const response = await apiClient.post<Commission>(`/commissions/${commissionId}/confirm`, { notes });
  if (!response.data) throw new Error('Failed to confirm commission');
  return response.data;
}

export async function disputeCommission(commissionId: string, reason: string): Promise<Commission> {
  const response = await apiClient.post<Commission>(`/commissions/${commissionId}/dispute`, { reason });
  if (!response.data) throw new Error('Failed to dispute commission');
  return response.data;
}

export async function markCommissionPaid(commissionId: string): Promise<Commission> {
  const response = await apiClient.post<Commission>(`/commissions/${commissionId}/mark-paid`);
  if (!response.data) throw new Error('Failed to mark commission as paid');
  return response.data;
}

// Commission Calculations
export async function calculateCommission(
  shopId: string, 
  productId: string, 
  quantity: number, 
  unitPrice: number
): Promise<CommissionCalculation> {
  const response = await apiClient.post<CommissionCalculation>('/commissions/calculate', {
    shop_id: shopId,
    product_id: productId,
    quantity,
    unit_price: unitPrice
  });
  if (!response.data) throw new Error('Failed to calculate commission');
  return response.data;
}

export async function previewCommission(
  transactionData: {
    shop_id: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
  }
): Promise<CommissionCalculation[]> {
  const response = await apiClient.post<CommissionCalculation[]>('/commissions/preview', transactionData);
  if (!response.data) throw new Error('Failed to preview commission');
  return response.data;
}

// Commission Summary
export async function getCommissionSummary(shopId?: string, farmerId?: string): Promise<CommissionSummary> {
  const params = new URLSearchParams();
  if (shopId) params.append('shop_id', shopId);
  if (farmerId) params.append('farmer_id', farmerId);
  const url = params.toString() ? `/commissions/summary?${params.toString()}` : '/commissions/summary';
  const response = await apiClient.get<CommissionSummary>(url);
  if (!response.data) throw new Error('Failed to get commission summary');
  return response.data;
}
