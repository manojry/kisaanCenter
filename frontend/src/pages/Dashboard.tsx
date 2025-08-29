import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Users, Package, ShoppingCart, CreditCard, DollarSign, TrendingUp } from 'lucide-react'

// Import missing types
import { User, Product, Transaction, Credit } from '@/types/entities'

interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalTransactions: number
  totalSales: number
  pendingCredits: number
  monthlyExpenses: number
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalTransactions: 0,
    totalSales: 0,
    pendingCredits: 0,
    monthlyExpenses: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [usersRes, productsRes, transactionsRes, creditsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/products'),
        apiClient.get('/transactions'),
        apiClient.get('/credits')
      ])
      // Add runtime array check and type assertion
      const users = Array.isArray(usersRes.data) ? usersRes.data as User[] : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data as Product[] : [];
      const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data as Transaction[] : [];
      const credits = Array.isArray(creditsRes.data) ? creditsRes.data as Credit[] : [];

      const totalSales = transactions.reduce((sum: number, t: Transaction) => sum + (t.total_amount || 0), 0);
      const pendingCredits = credits.reduce((sum: number, c: Credit) => sum + (c.amount || 0), 0);

      setStats({
        totalUsers: users.length,
        totalProducts: products.length,
        totalTransactions: transactions.length,
        totalSales,
        pendingCredits,
        monthlyExpenses: 2000 // This would come from expenses API when available
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data')
    }
  }

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    color: string
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-600">Complete overview of your shop operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={<Package className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions}
          icon={<ShoppingCart className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Sales"
          value={`$${stats.totalSales}`}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-emerald-500"
        />
        <StatCard
          title="Pending Credits"
          value={`$${stats.pendingCredits}`}
          icon={<CreditCard className="h-6 w-6 text-white" />}
          color="bg-orange-500"
        />
        <StatCard
          title="Monthly Expenses"
          value={`$${stats.monthlyExpenses}`}
          icon={<DollarSign className="h-6 w-6 text-white" />}
          color="bg-red-500"
        />
      </div>

      {/* Owner Capabilities Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Operations</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Morning Stock Review</span>
              <span className="text-sm font-medium text-green-600">✓ Complete</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sales Processing</span>
              <span className="text-sm font-medium text-blue-600">In Progress</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment Collection</span>
              <span className="text-sm font-medium text-orange-600">Pending</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">End-of-Day Review</span>
              <span className="text-sm font-medium text-gray-400">Scheduled</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today's Revenue</span>
              <span className="text-sm font-medium text-green-600">$100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Outstanding Credits</span>
              <span className="text-sm font-medium text-orange-600">$500</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Farmer Payments Due</span>
              <span className="text-sm font-medium text-red-600">$300</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commission Earned</span>
              <span className="text-sm font-medium text-blue-600">$50</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <span className="text-sm font-medium">Add User</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <span className="text-sm font-medium">Add Product</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <span className="text-sm font-medium">New Sale</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <CreditCard className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <span className="text-sm font-medium">Process Payment</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard