import React from 'react'
import { TransactionFilters } from '@/types/transaction'

interface User {
  id: number
  username: string
  role: string
}

interface TransactionFiltersProps {
  filters: TransactionFilters
  users: User[]
  onFilterChange: (key: keyof TransactionFilters, value: string) => void
  onClearFilters: () => void
  onApplyFilters: () => void
}

const TransactionFiltersComponent: React.FC<TransactionFiltersProps> = ({
  filters,
  users,
  onFilterChange,
  onClearFilters,
  onApplyFilters
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-white text-lg font-semibold mb-4">Filter Transactions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-white text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-white/30 bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-white/30 bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="">All Types</option>
            <option value="sale">Sale</option>
            <option value="return">Return</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-white/30 bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-1">Payment Status</label>
          <select
            value={filters.payment_status}
            onChange={(e) => onFilterChange('payment_status', e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-white/30 bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-1">From Date</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onFilterChange('date_from', e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-white/30 bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-1">To Date</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onFilterChange('date_to', e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-white/30 bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-1">Buyer</label>
          <select
            value={filters.buyer_id}
            onChange={(e) => onFilterChange('buyer_id', e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-white/30 bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="">All Buyers</option>
            {users.filter(user => user.role === 'buyer').map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={onApplyFilters}
          className="px-4 py-2 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        >
          Apply Filters
        </button>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 bg-white/20 text-white font-medium rounded-md hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}

export default TransactionFiltersComponent