
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { Transaction, TransactionFilters, TransactionFormData, TransactionAnalytics } from '@/types/transaction'
import { APIResponse, TransactionListResponse } from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface UseTransactionsReturn {
  transactions: Transaction[]
  analytics: TransactionAnalytics | null
  loading: boolean
  error: string | null
  filters: TransactionFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  setFilters: (filters: TransactionFilters) => void
  setPage: (page: number) => void
  fetchTransactions: () => Promise<void>
  createTransaction: (data: TransactionFormData) => Promise<boolean>
  updateTransaction: (id: number, data: TransactionFormData) => Promise<boolean>
  updatePayment: (id: number, paymentData: { amount: number }) => Promise<boolean>
  confirmCommission: (id: number) => Promise<boolean>
  refreshAnalytics: () => Promise<void>
}

const initialFilters: TransactionFilters = {
  search: '',
  type: '',
  status: '',
  payment_status: '',
  date_from: '',
  date_to: '',
  buyer_id: ''
}

export const useTransactions = (): UseTransactionsReturn => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<TransactionFilters>(initialFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const setFilters = useCallback((newFilters: TransactionFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const fetchTransactions = useCallback(async () => {
    if (!user?.shop_id) {
      setError('No shop association found')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const params = {
        ...filters,
        shop_id: user.shop_id,
        page: pagination.page,
        limit: pagination.limit
      }
      
      const response = await apiClient.get<APIResponse<TransactionListResponse>>('/transactions', { params })
      
      // Handle the APIResponse wrapper structure
      if (response.data.success && response.data.data) {
        const transactionData = response.data.data
        
        // Check if data has the expected structure
        if (Array.isArray(transactionData)) {
          // If data is directly an array
          setTransactions(transactionData)
          setPagination(prev => ({ 
            ...prev, 
            total: response.data.pagination?.total || 0,
            totalPages: response.data.pagination?.total_pages || 1,
            page: response.data.pagination?.page || 1,
            limit: response.data.pagination?.limit || 10
          }))
        } else if (transactionData && typeof transactionData === 'object' && 'transactions' in transactionData) {
          // If data is wrapped in transactions property
          const wrappedData = transactionData as TransactionListResponse
          setTransactions(wrappedData.transactions || [])
          setPagination({
            page: wrappedData.pagination?.page || 1,
            limit: wrappedData.pagination?.limit || 10,
            total: wrappedData.pagination?.total || 0,
            totalPages: wrappedData.pagination?.total_pages || 1
          })
        } else {
          console.warn('Unexpected transaction data structure:', transactionData)
          setTransactions([])
        }
      } else {
        setError(response.data.message || 'Failed to fetch transactions')
      }
    } catch (err: any) {
      setError('Failed to fetch transactions')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.shop_id, filters, pagination.page, pagination.limit])

  const createTransaction = useCallback(async (data: TransactionFormData): Promise<boolean> => {
    try {
      await apiClient.post<APIResponse<Transaction>>('/transactions', data)
      toast.success('Transaction created successfully')
      return true
    } catch (err) {
      toast.error('Failed to create transaction')
      console.error('Error creating transaction:', err)
      return false
    }
  }, [])

  const updateTransaction = useCallback(async (id: number, data: TransactionFormData): Promise<boolean> => {
    try {
      await apiClient.put<APIResponse<Transaction>>(`/transactions/${id}`, data)
      toast.success('Transaction updated successfully')
      return true
    } catch (err) {
      toast.error('Failed to update transaction')
      console.error('Error updating transaction:', err)
      return false
    }
  }, [])

  const updatePayment = useCallback(async (id: number, paymentData: { amount: number }): Promise<boolean> => {
    try {
      await apiClient.put<APIResponse<Transaction>>(`/transactions/${id}/payment`, paymentData)
      toast.success('Payment updated successfully')
      return true
    } catch (err) {
      toast.error('Failed to update payment')
      console.error('Error updating payment:', err)
      return false
    }
  }, [])

  const confirmCommission = useCallback(async (id: number): Promise<boolean> => {
    try {
      await apiClient.post<APIResponse<Transaction>>(`/transactions/${id}/confirm-commission`)
      toast.success('Commission confirmed successfully')
      return true
    } catch (err) {
      toast.error('Failed to confirm commission')
      console.error('Error confirming commission:', err)
      return false
    }
  }, [])

  const refreshAnalytics = useCallback(async () => {
    try {
      const response = await apiClient.get<APIResponse<TransactionAnalytics>>('/transactions/analytics')
      if (response.data.success && response.data.data) {
        setAnalytics(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    analytics,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPage,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    updatePayment,
    confirmCommission,
    refreshAnalytics
  }
}
