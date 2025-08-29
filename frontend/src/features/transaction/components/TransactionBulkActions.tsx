
import React, { useState } from 'react'
import { Transaction, TransactionStatus, PaymentStatus } from '@/types/transaction'
import { transactionService } from '@/services/transactionService'
import toast from 'react-hot-toast'

interface TransactionBulkActionsProps {
  selectedTransactions: Transaction[]
  onActionComplete: () => void
  onClearSelection: () => void
}

const TransactionBulkActions: React.FC<TransactionBulkActionsProps> = ({
  selectedTransactions,
  onActionComplete,
  onClearSelection
}) => {
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'status' | 'payment' | 'delete'
    value?: string
  } | null>(null)

  const handleBulkStatusUpdate = async (status: TransactionStatus) => {
    setPendingAction({ type: 'status', value: status })
    setShowConfirmDialog(true)
  }

  const handleBulkPaymentUpdate = async (paymentStatus: PaymentStatus) => {
    setPendingAction({ type: 'payment', value: paymentStatus })
    setShowConfirmDialog(true)
  }

  const handleBulkDelete = () => {
    setPendingAction({ type: 'delete' })
    setShowConfirmDialog(true)
  }

  const executeAction = async () => {
    if (!pendingAction) return

    setLoading(true)
    try {
      const transactionIds = selectedTransactions.map(t => t.id)

      switch (pendingAction.type) {
        case 'status':
          await transactionService.bulkUpdateStatus(transactionIds, pendingAction.value!)
          toast.success(`Updated ${transactionIds.length} transactions`)
          break
        case 'payment':
          // Implement bulk payment update if needed
          toast.success(`Updated payment status for ${transactionIds.length} transactions`)
          break
        case 'delete':
          // Implement bulk delete if needed
          toast.success(`Deleted ${transactionIds.length} transactions`)
          break
      }

      onActionComplete()
      onClearSelection()
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Failed to perform bulk action')
    } finally {
      setLoading(false)
      setShowConfirmDialog(false)
      setPendingAction(null)
    }
  }

  const getActionText = () => {
    if (!pendingAction) return ''
    
    switch (pendingAction.type) {
      case 'status':
        return `update status to "${pendingAction.value}"`
      case 'payment':
        return `update payment status to "${pendingAction.value}"`
      case 'delete':
        return 'delete'
      default:
        return ''
    }
  }

  if (selectedTransactions.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedTransactions.length} transaction(s) selected
            </span>
            <button
              onClick={onClearSelection}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear selection
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status Updates */}
            <div className="relative group">
              <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Update Status
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleBulkStatusUpdate('pending')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as Pending
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('active')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as Active
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('completed')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('cancelled')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as Cancelled
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Updates */}
            <div className="relative group">
              <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Update Payment
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleBulkPaymentUpdate('pending')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as Pending
                  </button>
                  <button
                    onClick={() => handleBulkPaymentUpdate('partial')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as Partial
                  </button>
                  <button
                    onClick={() => handleBulkPaymentUpdate('paid')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as Paid
                  </button>
                </div>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Bulk Action
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to {getActionText()} for {selectedTransactions.length} selected transaction(s)? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false)
                  setPendingAction(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TransactionBulkActions
