import React, { useState } from 'react'
import { TransactionFilters } from '@/types/transaction'
import { transactionService } from '@/services/transactionService'
import { exportTransactionsToCSV } from '@/utils/transactionUtils'
import toast from 'react-hot-toast'

interface TransactionExportProps {
  filters: TransactionFilters
  onClose: () => void
}

const TransactionExport: React.FC<TransactionExportProps> = ({ filters, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })

  const handleExport = async () => {
    setLoading(true)
    
    try {
      const exportFilters = {
        ...filters,
        date_from: dateRange.from || filters.date_from,
        date_to: dateRange.to || filters.date_to
      }

      if (exportFormat === 'csv') {
        // For CSV, we'll fetch the data and use our utility function
        const response = await transactionService.getTransactions({
          ...exportFilters,
          page: 1,
          limit: 10000 // Large limit to get all data
        })
        exportTransactionsToCSV(response.transactions)
      } else {
        // For other formats, use the backend export endpoint
        const blob = await transactionService.exportTransactions(exportFilters)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.${exportFormat}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      toast.success('Export completed successfully')
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export transactions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Export Transactions</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                className="p-2 border border-gray-300 rounded-md"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                className="p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TransactionExport