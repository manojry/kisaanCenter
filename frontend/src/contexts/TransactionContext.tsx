
import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Transaction, TransactionFilters } from '@/types/transaction'

interface TransactionState {
  transactions: Transaction[]
  selectedTransaction: Transaction | null
  filters: TransactionFilters
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type TransactionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_SELECTED_TRANSACTION'; payload: Transaction | null }
  | { type: 'SET_FILTERS'; payload: TransactionFilters }
  | { type: 'SET_PAGINATION'; payload: Partial<TransactionState['pagination']> }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: number }

const initialState: TransactionState = {
  transactions: [],
  selectedTransaction: null,
  filters: {
    search: '',
    type: '',
    status: '',
    payment_status: '',
    date_from: '',
    date_to: '',
    category_id: '',
    user_id: ''
  },
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
}

const transactionReducer = (state: TransactionState, action: TransactionAction): TransactionState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload, loading: false, error: null }
    
    case 'SET_SELECTED_TRANSACTION':
      return { ...state, selectedTransaction: action.payload }
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload }
    
    case 'SET_PAGINATION':
      return { ...state, pagination: { ...state.pagination, ...action.payload } }
    
    case 'ADD_TRANSACTION':
      return { 
        ...state, 
        transactions: [action.payload, ...state.transactions],
        pagination: { ...state.pagination, total: state.pagination.total + 1 }
      }
    
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        ),
        selectedTransaction: state.selectedTransaction?.id === action.payload.id 
          ? action.payload 
          : state.selectedTransaction
      }
    
    case 'REMOVE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        pagination: { ...state.pagination, total: state.pagination.total - 1 },
        selectedTransaction: state.selectedTransaction?.id === action.payload 
          ? null 
          : state.selectedTransaction
      }
    
    default:
      return state
  }
}

interface TransactionContextType {
  state: TransactionState
  dispatch: React.Dispatch<TransactionAction>
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export const useTransactionContext = () => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransactionContext must be used within a TransactionProvider')
  }
  return context
}

interface TransactionProviderProps {
  children: ReactNode
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState)

  return (
    <TransactionContext.Provider value={{ state, dispatch }}>
      {children}
    </TransactionContext.Provider>
  )
}
