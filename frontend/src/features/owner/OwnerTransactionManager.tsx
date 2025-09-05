import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Calendar, Eye, Trash2, 
  DollarSign, Package, Clock, CheckCircle
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/services/api'
import toast from 'react-hot-toast'

interface User {
  id: number
  username: string
  full_name: string
  role: string
}

interface Product {
  id: number
  name: string
  category?: string
  price: number
}

interface TransactionItem {
  product_id: number
  product_name?: string
  quantity: number
  price_per_unit: number
  total_price: number
}

interface Transaction {
  id: number
  buyer_user_id: number
  buyer_name?: string
  type: 'sale' | 'purchase'
  commission_rate: number
  date: string
  total_amount: number
  farmer_paid_amount: number
  buyer_paid_amount: number
  commission_confirmed: boolean
  status: string
  items: TransactionItem[]
  created_at: string
}

interface CreateTransactionData {
  buyer_user_id: number
  type: 'sale' | 'purchase'
  commission_rate: number
  date: string
  items: Array<{
    product_id: number
    quantity: number
    price_per_unit: number
  }>
  farmer_paid_amount?: number
  commission_confirmed?: boolean
  buyer_paid_amount?: number
}

const OwnerTransactionManager: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('view')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Transaction data
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  // Form state
  const [formData, setFormData] = useState<CreateTransactionData & { farmer_user_id: number }>({
    buyer_user_id: 0,
    farmer_user_id: 0,
    type: 'sale',
    commission_rate: 5,
    date: new Date().toISOString().split('T')[0],
    items: [],
    farmer_paid_amount: 0,
    commission_confirmed: false,
    buyer_paid_amount: 0
  })

  // Load initial data
  useEffect(() => {
    fetchUsers()
    fetchProducts()
    fetchTransactionsByDate(selectedDate)
  }, [])

  const fetchUsers = async () => {
    if (!user?.shop_id) return
    try {
      const response = await apiClient.get(`/owner-admin/shops/${user.shop_id}/users`)
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchProducts = async () => {
    if (!user?.shop_id) return
    try {
      const response = await apiClient.get(`/owner-admin/shops/${user.shop_id}/products`)
      if (response.success && Array.isArray(response.data)) {
        // Only include products assigned to shop and active
  setProducts(response.data.filter((p: any) => (p.record_status === 'active' && (!p.shop_id || p.shop_id === user.shop_id))))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchTransactionsByDate = useCallback(async (date: string) => {
    if (!user?.shop_id) return
    setLoading(true)
    try {
      const response = await apiClient.get(`/transactions`, {
        params: {
          shop_id: user.shop_id,
          date_from: date,
          date_to: date
        }
      })
      if (response.success && Array.isArray(response.data)) {
        setTransactions(response.data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [user?.shop_id])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    fetchTransactionsByDate(date)
  }

  const addTransactionItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: 0, quantity: 1, price_per_unit: 0 }]
    }))
  }

  const updateTransactionItem = (index: number, field: keyof TransactionItem, value: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeTransactionItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => 
      total + (item.quantity * item.price_per_unit), 0
    )
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.shop_id) return
    if (formData.items.length === 0) {
      toast.error('Please add at least one item to the transaction')
      return
    }
    if (formData.buyer_user_id === 0) {
      toast.error('Please select a buyer')
      return
    }
    if (formData.farmer_user_id === 0) {
      toast.error('Please select a farmer')
      return
    }
    setLoading(true)
    try {
      const response = await apiClient.post('/transactions', {
        ...formData,
        shop_id: user.shop_id
      })
      if (response.success) {
        toast.success('Transaction created successfully!')
        setFormData({
          buyer_user_id: 0,
          farmer_user_id: 0,
          type: 'sale',
          commission_rate: 5,
          date: new Date().toISOString().split('T')[0],
          items: [],
          farmer_paid_amount: 0,
          commission_confirmed: false,
          buyer_paid_amount: 0
        })
        setActiveTab('view')
        fetchTransactionsByDate(selectedDate)
      }
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      toast.error(error?.response?.data?.message || 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.commission_confirmed && transaction.farmer_paid_amount > 0 && transaction.buyer_paid_amount > 0) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Complete</span>
    } else if (transaction.buyer_paid_amount === 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Buyer Payment Pending</span>
    } else if (transaction.farmer_paid_amount === 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Farmer Payment Pending</span>
    } else if (!transaction.commission_confirmed) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Commission Pending</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Processing</span>
  }

  const getTodayStats = () => {
    const totalTransactions = transactions.length
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0)
    const completedTransactions = transactions.filter(t => 
      t.commission_confirmed && t.farmer_paid_amount > 0 && t.buyer_paid_amount > 0
    ).length
    const pendingPayments = transactions.filter(t => 
      t.buyer_paid_amount === 0 || t.farmer_paid_amount === 0
    ).length

    return { totalTransactions, totalRevenue, completedTransactions, pendingPayments }
  }

  const stats = getTodayStats()

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600">Create new transactions and view daily reports</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'view' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            View Transactions
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'create' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Create Transaction
          </button>
        </div>
      </div>

      {/* Daily Stats */}
      {activeTab === 'view' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">{stats.completedTransactions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Count</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Transactions Tab */}
      {activeTab === 'view' && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Daily Transactions</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={() => fetchTransactionsByDate(selectedDate)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions found for {selectedDate}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Buyer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Commission</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">#{transaction.id}</td>
                        <td className="py-3 px-4">{transaction.buyer_name || `User ${transaction.buyer_user_id}`}</td>
                        <td className="py-3 px-4 capitalize">{transaction.type}</td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(transaction.total_amount)}</td>
                        <td className="py-3 px-4">{transaction.commission_rate}%</td>
                        <td className="py-3 px-4">{getStatusBadge(transaction)}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Transaction Tab */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Create New Transaction</h3>
          </div>

          <form onSubmit={handleCreateTransaction} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buyer</label>
                <select
                  value={formData.buyer_user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyer_user_id: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value={0}>Select Buyer</option>
                  {users.filter(u => u.role === 'buyer').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Farmer</label>
                <select
                  value={formData.farmer_user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmer_user_id: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value={0}>Select Farmer</option>
                  {users.filter(u => u.role === 'farmer').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'sale' | 'purchase' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="sale">Sale</option>
                  <option value="purchase">Purchase</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            {/* Commission Rate */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                />
              </div>
            </div>

            {/* Transaction Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Transaction Items</h4>
                <button
                  type="button"
                  onClick={addTransactionItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  Add Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No items added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateTransactionItem(index, 'product_id', parseInt(e.target.value))}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        required
                      >
                        <option value={0}>Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => updateTransactionItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0.1"
                        step="0.1"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Price per unit"
                        value={item.price_per_unit}
                        onChange={(e) => updateTransactionItem(index, 'price_per_unit', parseFloat(e.target.value) || 0)}
                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0"
                        step="0.01"
                        required
                      />
                      <span className="w-24 text-sm font-medium">
                        {formatCurrency(item.quantity * item.price_per_unit)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTransactionItem(index)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            {formData.items.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.items.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default OwnerTransactionManager
