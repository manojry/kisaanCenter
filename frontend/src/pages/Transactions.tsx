import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Eye, 
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { TransactionStatus, CompletionStatus, UserRole } from '@/types/enums'

// Mock transaction data
const mockTransactions = [
  {
    id: 1,
    buyer_username: 'buyer1',
    total_amount: 5000,
    commission_amount: 500,
    buyer_paid_amount: 3000,
    farmer_paid_amount: 2000,
    commission_confirmed: false,
    status: TransactionStatus.ACTIVE,
    completion_status: CompletionStatus.PARTIAL,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    buyer_username: 'buyer2',
    total_amount: 3500,
    commission_amount: 350,
    buyer_paid_amount: 3500,
    farmer_paid_amount: 3150,
    commission_confirmed: true,
    status: TransactionStatus.COMPLETED,
    completion_status: CompletionStatus.COMPLETE,
    created_at: '2024-01-14T15:45:00Z'
  },
  {
    id: 3,
    buyer_username: 'buyer3',
    total_amount: 7500,
    commission_amount: 750,
    buyer_paid_amount: 0,
    farmer_paid_amount: 0,
    commission_confirmed: false,
    status: TransactionStatus.PENDING,
    completion_status: CompletionStatus.PENDING,
    created_at: '2024-01-16T09:15:00Z'
  }
]

interface TransactionCardProps {
  transaction: any
  onView: (id: number) => void
  onConfirmCommission: (id: number) => void
  canConfirmCommission: boolean
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  transaction, 
  onView, 
  onConfirmCommission,
  canConfirmCommission 
}) => {
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'bg-success-100 text-success-800'
      case TransactionStatus.ACTIVE:
        return 'bg-blue-100 text-blue-800'
      case TransactionStatus.PENDING:
        return 'bg-warning-100 text-warning-800'
      case TransactionStatus.CANCELLED:
        return 'bg-danger-100 text-danger-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompletionIcon = (status: CompletionStatus) => {
    switch (status) {
      case CompletionStatus.COMPLETE:
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case CompletionStatus.PARTIAL:
        return <Clock className="w-4 h-4 text-warning-600" />
      case CompletionStatus.PENDING:
        return <AlertCircle className="w-4 h-4 text-danger-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const completionPercentage = transaction.total_amount > 0 
    ? ((transaction.buyer_paid_amount + transaction.farmer_paid_amount) / (transaction.total_amount * 2)) * 100
    : 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">Transaction #{transaction.id}</h3>
          <p className="text-sm text-gray-500">Buyer: {transaction.buyer_username}</p>
          <p className="text-sm text-gray-500">
            {new Date(transaction.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {getCompletionIcon(transaction.completion_status)}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="font-medium">₹{transaction.total_amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Commission</p>
          <p className="font-medium">₹{transaction.commission_amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Buyer Paid</p>
          <p className="font-medium text-blue-600">₹{transaction.buyer_paid_amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Farmer Paid</p>
          <p className="font-medium text-green-600">₹{transaction.farmer_paid_amount.toLocaleString()}</p>
        </div>
      </div>

      {/* Completion Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Completion Progress</span>
          <span>{completionPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Commission Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Commission</span>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          transaction.commission_confirmed 
            ? 'bg-success-100 text-success-800' 
            : 'bg-warning-100 text-warning-800'
        }`}>
          {transaction.commission_confirmed ? 'Confirmed' : 'Pending'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(transaction.id)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </Button>
        
        {canConfirmCommission && !transaction.commission_confirmed && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onConfirmCommission(transaction.id)}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirm Commission
          </Button>
        )}
      </div>
    </div>
  )
}

const Transactions: React.FC = () => {
  const { user, hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isLoading] = useState(false)

  // Filter transactions based on user role
  const getFilteredTransactions = () => {
    let filtered = mockTransactions

    // Role-based filtering
    if (user?.role === UserRole.FARMER) {
      // Farmers see transactions where they have stock
      filtered = filtered // TODO: Filter by farmer involvement
    } else if (user?.role === UserRole.BUYER) {
      // Buyers see their own transactions
      filtered = filtered.filter(t => t.buyer_username === user.username)
    }

    // Search filtering
    if (search) {
      filtered = filtered.filter(t => 
        t.buyer_username.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toString().includes(search)
      )
    }

    // Status filtering
    if (selectedStatus) {
      filtered = filtered.filter(t => t.status === selectedStatus)
    }

    return filtered
  }

  const handleView = (id: number) => {
    console.log('View transaction:', id)
    // TODO: Navigate to transaction details
  }

  const handleConfirmCommission = (id: number) => {
    console.log('Confirm commission for transaction:', id)
    // TODO: Implement commission confirmation
  }

  const canConfirmCommission = hasPermission('confirm', 'commission')
  const canCreateTransaction = hasPermission('create', 'transaction')

  const filteredTransactions = getFilteredTransactions()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">
            {user?.role === UserRole.BUYER 
              ? 'Your purchase transactions'
              : user?.role === UserRole.FARMER
              ? 'Transactions involving your stock'
              : 'All shop transactions'
            }
          </p>
        </div>
        
        {canCreateTransaction && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value={TransactionStatus.PENDING}>Pending</option>
              <option value={TransactionStatus.ACTIVE}>Active</option>
              <option value={TransactionStatus.COMPLETED}>Completed</option>
              <option value={TransactionStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards for Owners */}
      {(user?.role === UserRole.OWNER || user?.role === UserRole.SUPERADMIN) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{mockTransactions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg font-bold text-gray-900">
                  {mockTransactions.filter(t => t.completion_status === CompletionStatus.PENDING).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-lg font-bold text-gray-900">
                  {mockTransactions.filter(t => t.completion_status === CompletionStatus.COMPLETE).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Commission</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{mockTransactions.reduce((sum, t) => sum + t.commission_amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onView={handleView}
              onConfirmCommission={handleConfirmCommission}
              canConfirmCommission={canConfirmCommission}
            />
          ))}
        </div>
      )}

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {search || selectedStatus 
              ? 'Try adjusting your search or filter criteria.'
              : 'Transactions will appear here once created.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default Transactions