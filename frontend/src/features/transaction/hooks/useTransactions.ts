
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { Transaction, TransactionFilters, TransactionFormData, TransactionAnalytics } from '@/types/transaction'
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
  category_id: '',
  user_id: ''
}

export const useTransactions = (): UseTransactionsReturn => {
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
    setLoading(true)
    setError(null)
    
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      }
      
      const response = await apiClient.get('/transactions', { params })
      setTransactions(response.data.transactions)
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      })
    } catch (err) {
      setError('Failed to fetch transactions')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])

  const createTransaction = useCallback(async (data: TransactionFormData): Promise<boolean> => {
    try {
      const response = await apiClient.post('/transactions', data)
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
      const response = await apiClient.put(`/transactions/${id}`, data)
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
      const response = await apiClient.put(`/transactions/${id}/payment`, paymentData)
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
      const response = await apiClient.post(`/transactions/${id}/confirm-commission`)
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
      const response = await apiClient.get('/transactions/analytics')
      setAnalytics(response.data)
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
