import React, { useState } from 'react'
import { useTransactions } from '@/features/transaction/hooks/useTransactions'
import { useProducts } from '@/features/product/hooks/useProducts'
import { useUsers } from '@/features/user/hooks/useUsers'
import TransactionFilters from '@/features/transaction/components/TransactionFilters'
import TransactionTable from '@/features/transaction/components/TransactionTable'
import TransactionDetailsModal from '@/features/transaction/components/TransactionDetailsModal'
import { Transaction } from '@/types/transaction'
import { Link } from 'react-router-dom'

const Transactions: React.FC = () => {
  const {
    transactions,
    analytics,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPage,
    fetchTransactions,
    confirmCommission,
    refreshAnalytics
  } = useTransactions()

  const productsQuery = useProducts();
  const products = Array.isArray(productsQuery.data) ? productsQuery.data : [];

  const usersQuery = useUsers();
  const users = Array.isArray(usersQuery.data?.data) ? usersQuery.data.data : [];

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDetails(true)
  }

  const handleFiltersApply = (newFilters: any) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleFiltersClear = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      payment_status: '',
      date_from: '',
      date_to: '',
      user_id: ''
    })
    setPage(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading transactions</div>
          <button
            onClick={fetchTransactions}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="mt-2 text-gray-600">Manage and track all transactions</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                to="/transaction-entry"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium inline-block"
              >
                + New Transaction
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_transactions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.total_revenue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.total_commission)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.pending_payments}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <TransactionFilters
              filters={filters}
              users={users}
              onFilterChange={handleFiltersApply}
              onClearFilters={handleFiltersClear}
              onApplyFilters={fetchTransactions}
            />
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <TransactionTable
              transactions={transactions}
              loading={loading}
              pagination={pagination}
              onPageChange={setPage}
              onViewDetails={handleViewDetails}
              onCommissionConfirm={confirmCommission}
            />
          </div>
        </div>

        {/* Details Modal */}
        <TransactionDetailsModal
          transaction={selectedTransaction}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      </div>
    </div>
  )
}

export default Transactions