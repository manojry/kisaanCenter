import { Plan } from '../types/entities'

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
    const response = await fetch(`/api/v1/plans?page=${page}&limit=${limit}`)
    const data: PlanApiResponse = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch plans')
    }
    
    if (!data.success) {
      throw new Error(data.message || 'API request was not successful')
    }

    return {
      plans: data.data.items || [],
      pagination: {
        total: data.data.total || 0,
        page: data.data.page || 1,
        limit: data.data.limit || 10,
        totalPages: data.data.total_pages || 1
      }
    }
  } catch (error) {
    console.error('Error fetching plans:', error)
    throw error
  }
}

export async function fetchAllPlans(): Promise<Plan[]> {
  try {
    // Fetch first page to get total count
    const firstPage = await fetchPlans(1, 10)
    
    // If there are more pages, fetch all of them
    if (firstPage.pagination.totalPages > 1) {
      const allPages = await Promise.all(
        Array.from({ length: firstPage.pagination.totalPages }, (_, i) =>
          fetchPlans(i + 1, firstPage.pagination.limit)
        )
      )
      
      return allPages.flatMap(page => page.plans)
    }
    
    return firstPage.plans
  } catch (error) {
    console.error('Error fetching all plans:', error)
    throw error
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
    const response = await fetch('/api/v1/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planData),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create plan')
    }

    if (!result.success) {
      throw new Error(result.message || 'API request was not successful')
    }

    return result.data
  } catch (error) {
    console.error('Error creating plan:', error)
    throw error
  }
}

export async function updatePlan(planId: number, planData: UpdatePlanData): Promise<Plan> {
  try {
    const response = await fetch(`/api/v1/plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planData),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update plan')
    }

    if (!result.success) {
      throw new Error(result.message || 'API request was not successful')
    }

    return result.data
  } catch (error) {
    console.error('Error updating plan:', error)
    throw error
  }
}

export async function deletePlan(planId: number): Promise<void> {
  try {
    const response = await fetch(`/api/v1/plans/${planId}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete plan')
    }

    if (!result.success) {
      throw new Error(result.message || 'API request was not successful')
    }
  } catch (error) {
    console.error('Error deleting plan:', error)
    throw error
  }
}
