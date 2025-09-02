
import React, { useState, useEffect, useRef } from 'react'
import { Transaction } from '@/types/transaction'
import { transactionService } from '@/services/transactionService'
import { formatCurrency, formatDate } from '@/utils/transactionUtils'
// import { useDebounce } from '@/hooks/useDebounce'

interface TransactionSearchProps {
  onSelect: (transaction: Transaction) => void
  placeholder?: string
  className?: string
}

const TransactionSearch: React.FC<TransactionSearchProps> = ({
  onSelect,
  placeholder = "Search transactions...",
  className = ""
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  // const debouncedQuery = useDebounce(query, 300)
  const debouncedQuery = query;
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchTransactions(debouncedQuery)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [debouncedQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchTransactions = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await transactionService.getTransactions({
        search: searchQuery,
        type: '',
        status: '',
        payment_status: '',
        date_from: '',
        date_to: '',
        buyer_id: '',
        page: 1,
        limit: 10
      })
      setResults(response.transactions)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (transaction: Transaction) => {
    onSelect(transaction)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200">{part}</mark>
      ) : (
        part
      )
    )
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((transaction) => (
                <button
                  key={transaction.id}
                  onClick={() => handleSelect(transaction)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          #{transaction.id}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          {highlightMatch(transaction.buyer_username || `User ${transaction.buyer_user_id}`, query)}
                        </span>
                        <span>{formatDate(transaction.date)}</span>
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0)}
                      </div>
                      <div className={`text-xs ${
                        transaction.payment_status === 'paid' ? 'text-green-600' :
                        transaction.payment_status === 'partial' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {transaction.payment_status}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 && !loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No transactions found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default TransactionSearch
