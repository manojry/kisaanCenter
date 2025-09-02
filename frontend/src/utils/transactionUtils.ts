
import { Transaction, TransactionStatus, PaymentStatus } from '@/types/transaction'

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getStatusColor = (status: string, type: 'status' | 'payment' = 'status'): string => {
  if (type === 'status') {
    switch (status as TransactionStatus) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'active': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  } else {
    switch (status as PaymentStatus) {
      case 'paid': return 'text-green-600 bg-green-100'
      case 'partial': return 'text-yellow-600 bg-yellow-100'
      case 'pending': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
}

export const calculateTransactionTotal = (transaction: Transaction): number => {
  if (!transaction.items || transaction.items.length === 0) {
    return transaction.buyer_paid_amount + transaction.farmer_paid_amount
  }
  
  return transaction.items.reduce((total, item) => {
    return total + (item.quantity * item.price)
  }, 0)
}

export const calculateCommission = (transaction: Transaction): number => {
  if (!transaction.commission_rate) return 0
  
  const total = calculateTransactionTotal(transaction)
  return (total * transaction.commission_rate) / 100
}

export const calculateNetAmount = (transaction: Transaction): number => {
  const total = calculateTransactionTotal(transaction)
  const commission = calculateCommission(transaction)
  return total - commission
}
