
export const TRANSACTION_TYPES = [
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'return', label: 'Return' },
  { value: 'exchange', label: 'Exchange' }
] as const

export const TRANSACTION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' }
] as const

export const DEFAULT_COMMISSION_RATE = 10

export const TRANSACTION_FORM_VALIDATION = {
  MIN_COMMISSION_RATE: 0,
  MAX_COMMISSION_RATE: 100,
  MIN_QUANTITY: 0.01,
  MIN_PRICE: 0.01,
  MAX_ITEMS: 50
}

export const PAGINATION_LIMITS = [10, 25, 50, 100] as const

export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm'
}

export const CURRENCY_CONFIG = {
  LOCALE: 'en-IN',
  CURRENCY: 'INR',
  SYMBOL: '₹'
}

export const TRANSACTION_COLORS = {
  STATUS: {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    active: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  },
  PAYMENT: {
    pending: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    paid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
  }
}

export const API_ENDPOINTS = {
  TRANSACTIONS: '/api/v1/transactions',
  ANALYTICS: '/api/v1/transactions/analytics',
  EXPORT: '/api/v1/transactions/export',
  BULK_UPDATE: '/api/v1/transactions/bulk-update',
  PAYMENT_UPDATE: (id: number) => `/api/v1/transactions/${id}/payment`,
  CONFIRM_COMMISSION: (id: number) => `/api/v1/transactions/${id}/confirm-commission`
}
