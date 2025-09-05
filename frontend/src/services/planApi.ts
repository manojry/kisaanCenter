import { Plan } from '../types/entities';
import { apiClient } from './api';

// Generic API response type
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PlanApiResponse {
  success: boolean
  message: string
  data: {
    items: Plan[]
    total: number
    page: number
    limit: number
    total_pages: number
  }
  error_code: string | null
  timestamp: string
}

export interface PaginatedPlansResult {
  plans: Plan[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function fetchPlans(page: number = 1, limit: number = 10): Promise<PaginatedPlansResult> {
  try {
    const response = await apiClient.get<{
      items: Plan[]
      total: number
      page: number
      limit: number
      total_pages: number
  }>(`/subscriptions/plans?page=${page}&limit=${limit}`)
    
    if (!response.success) {
      throw new Error(response.message || 'API request was not successful')
    }

    const data = response.data
    return {
      plans: data.items || [],
      pagination: {
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.total_pages || 1
      }
    }
  } catch (error) {
    console.error('Error fetching plans:', error)
    throw error
  }
}

export async function fetchAllPlans(): Promise<Plan[]> {
  try {
    const response = await apiClient.get<ApiResponse<Plan[]>>('/subscriptions/plans');
    // If backend sends { success, message, data: [...] }
    // If backend sends { success, message, data: [...] }
    if (response?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // If backend sends { success, message, data: { items: [...] } }
    if (response?.data && response.data.data && Array.isArray(response.data.data.items)) {
      return response.data.data.items;
    }
    // If backend sends { success, message, data: [...] } (data is array)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    // If backend sends { success, message, data: [...] } (data is array, not data.data)
    if (response?.data && Array.isArray(response.data)) {
      return response.data as Plan[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching all plans:', error);
    throw error;
  }
}

export function getPlanPrice(plan: Plan, billingCycle: 'monthly' | 'quarterly' | 'yearly'): number {
  switch (billingCycle) {
    case 'monthly':
      return plan.monthly_price
    case 'quarterly':
      return plan.quarterly_price || plan.monthly_price * 3
    case 'yearly':
      return plan.yearly_price || plan.monthly_price * 12
    default:
      return plan.monthly_price
  }
}

export function formatPlanFeatures(features: Record<string, any> | null | undefined): string[] {
  if (!features) return []
  
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
}

export function comparePlans(planA: Plan, planB: Plan): number {
  // Compare by monthly price (ascending)
  return planA.monthly_price - planB.monthly_price
}

// Plan CRUD operations
export interface CreatePlanData {
  name: string
  description?: string
  monthly_price: number
  quarterly_price?: number
  yearly_price?: number
  max_farmers?: number
  max_buyers?: number
  max_transactions?: number
  data_retention_months?: number
  features?: Record<string, any>
}

export interface UpdatePlanData {
  name?: string
  description?: string
  monthly_price?: number
  quarterly_price?: number
  yearly_price?: number
  max_farmers?: number
  max_buyers?: number
  max_transactions?: number
  data_retention_months?: number
  features?: Record<string, any>
  status?: string
}

export async function createPlan(planData: CreatePlanData): Promise<Plan> {
  try {
  const response = await apiClient.post<ApiResponse<Plan>>('/subscriptions/plans', planData);
    if (response?.data?.data) {
      return response.data.data;
    }
    throw new Error('Invalid response from backend');
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
}

export async function updatePlan(planId: number, planData: UpdatePlanData): Promise<Plan> {
  try {
  const response = await apiClient.put<ApiResponse<Plan>>(`/subscriptions/plans/${planId}`, planData);
    if (response?.data?.data) {
      return response.data.data;
    }
    throw new Error('Invalid response from backend');
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
}

export async function deletePlan(planId: number): Promise<void> {
  try {
  await apiClient.delete(`/subscriptions/plans/${planId}`);
  } catch (error) {
    console.error('Error deleting plan:', error);
    throw error;
  }
}
