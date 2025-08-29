import React from 'react'
import { Transaction } from '@/types/transaction'

interface TransactionDetailsModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  if (!isOpen || !transaction) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string, type: 'status' | 'payment') => {
    if (type === 'status') {
      switch (status) {
        case 'completed': return 'text-green-600 bg-green-100'
        case 'pending': return 'text-yellow-600 bg-yellow-100'
        case 'cancelled': return 'text-red-600 bg-red-100'
        default: return 'text-gray-600 bg-gray-100'
      }
    } else {
      switch (status) {
        case 'paid': return 'text-green-600 bg-green-100'
        case 'partial': return 'text-yellow-600 bg-yellow-100'
        case 'pending': return 'text-red-600 bg-red-100'
        default: return 'text-gray-600 bg-gray-100'
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction Details #{transaction.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
                <p className="text-lg font-semibold text-gray-900">#{transaction.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Buyer</label>
                <p className="text-lg text-gray-900">
                  {transaction.buyer_username || `User ${transaction.buyer_user_id}`}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Type</label>
                <p className="text-lg text-gray-900 capitalize">{transaction.type}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Date</label>
                <p className="text-lg text-gray-900">{formatDate(transaction.date)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status, 'status')}`}>
                  {transaction.status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.payment_status, 'payment')}`}>
                  {transaction.payment_status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Commission Rate</label>
                <p className="text-lg text-gray-900">{transaction.commission_rate}%</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Commission Confirmed</label>
                <p className="text-lg text-gray-900">
                  {transaction.commission_confirmed ? (
                    <span className="text-green-600">✓ Yes</span>
                  ) : (
                    <span className="text-red-600">✗ No</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Buyer Paid</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(transaction.buyer_paid_amount)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Farmer Paid</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(transaction.farmer_paid_amount)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Commission</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(transaction.commission_amount)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">Total Transaction Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(transaction.buyer_paid_amount + transaction.farmer_paid_amount)}
              </p>
            </div>
          </div>

          {/* Transaction Items */}
          {transaction.items && transaction.items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transaction.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.product_name || `Product ${item.product_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(item.price)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.quantity * item.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TransactionDetailsModal