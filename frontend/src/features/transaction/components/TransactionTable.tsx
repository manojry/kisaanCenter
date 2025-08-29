
import React from 'react'
import { Transaction } from '@/types/transaction'

interface TransactionTableProps {
  transactions: Transaction[]
  loading: boolean
  onEdit: (transaction: Transaction) => void
  onViewDetails: (transaction: Transaction) => void
  onPaymentUpdate: (transactionId: number, paymentData: { amount: number }) => void
  onCommissionConfirm: (transactionId: number) => void
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  loading,
  onEdit,
  onViewDetails,
  onPaymentUpdate,
  onCommissionConfirm
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getStatusBadge = (status: string, type: 'status' | 'payment') => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full"
    
    if (type === 'status') {
      switch (status) {
        case 'completed':
          return `${baseClasses} bg-green-100 text-green-800`
        case 'pending':
          return `${baseClasses} bg-yellow-100 text-yellow-800`
        case 'cancelled':
          return `${baseClasses} bg-red-100 text-red-800`
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`
      }
    } else {
      switch (status) {
        case 'paid':
          return `${baseClasses} bg-green-100 text-green-800`
        case 'partial':
          return `${baseClasses} bg-yellow-100 text-yellow-800`
        case 'pending':
          return `${baseClasses} bg-red-100 text-red-800`
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{transaction.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {transaction.buyer_username || `User ${transaction.buyer_user_id}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="capitalize text-sm text-gray-900">
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(transaction.buyer_paid_amount + transaction.farmer_paid_amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">
                      {formatCurrency(transaction.commission_amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.commission_rate}%
                      {transaction.commission_confirmed && (
                        <span className="ml-1 text-green-600">✓</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(transaction.status, 'status')}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(transaction.payment_status, 'payment')}>
                    {transaction.payment_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewDetails(transaction)}
                      className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded text-xs bg-blue-50 hover:bg-blue-100"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEdit(transaction)}
                      className="text-yellow-600 hover:text-yellow-900 px-2 py-1 rounded text-xs bg-yellow-50 hover:bg-yellow-100"
                    >
                      Edit
                    </button>
                    {transaction.payment_status !== 'paid' && (
                      <button
                        onClick={() => {
                          const amount = prompt('Enter payment amount:')
                          if (amount) {
                            onPaymentUpdate(transaction.id, { amount: parseFloat(amount) })
                          }
                        }}
                        className="text-green-600 hover:text-green-900 px-2 py-1 rounded text-xs bg-green-50 hover:bg-green-100"
                      >
                        Pay
                      </button>
                    )}
                    {!transaction.commission_confirmed && (
                      <button
                        onClick={() => onCommissionConfirm(transaction.id)}
                        className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded text-xs bg-purple-50 hover:bg-purple-100"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
          <p className="text-gray-500">Try adjusting your filters or create a new transaction.</p>
        </div>
      )}
    </div>
  )
}

export default TransactionTable
