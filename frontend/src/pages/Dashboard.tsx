import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import OwnerWorkflow from '@/components/OwnerWorkflow'
import OwnerQuickActions from '@/components/OwnerQuickActions'
import RouteTest from '@/components/RouteTest'
import { 
  Users, Package, ShoppingCart, CreditCard, DollarSign, TrendingUp, 
  AlertCircle, CheckCircle, Clock, Plus, Eye, ArrowRight 
} from 'lucide-react'

interface OwnerDashboardStats {
  // Financial Overview
  todayRevenue: number
  monthlyRevenue: number
  totalCommission: number
  pendingCredits: number
  
  // Three-Party Completion Tracking
  pendingBuyerPayments: number
  pendingFarmerPayments: number
  pendingCommissionConfirmations: number
  completedTransactions: number
  
  // Operational Metrics
  activeStock: number
  totalFarmers: number
  totalBuyers: number
  totalEmployees: number
}



const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<OwnerDashboardStats>({
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalCommission: 0,
    pendingCredits: 0,
    pendingBuyerPayments: 0,
    pendingFarmerPayments: 0,
    pendingCommissionConfirmations: 0,
    completedTransactions: 0,
    activeStock: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    totalEmployees: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOwnerDashboardData()
  }, [])

  const fetchOwnerDashboardData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const shopId = user.shop_id || 1 // Fallback for testing
      
      // Fetch owner-specific data with error handling for each endpoint
      const results = await Promise.allSettled([
        apiClient.get(`/transactions/shop/${shopId}/dashboard`),
        apiClient.get('/transactions/completion-status/pending', { params: { shop_id: shopId } }),
        apiClient.get('/users', { params: { shop_id: shopId } }),
        apiClient.get('/transactions', { params: { shop_id: shopId, limit: 100 } })
      ])
      
      // Safely extract data with fallbacks
      const dashboardData = results[0].status === 'fulfilled' ? results[0].value?.data?.data || {} : {}
      const incompleteData = results[1].status === 'fulfilled' ? results[1].value?.data?.data || [] : []
      const usersData = results[2].status === 'fulfilled' ? results[2].value?.data?.data || [] : []
      const transactionsData = results[3].status === 'fulfilled' ? results[3].value?.data?.data || [] : []
      
      // Process incomplete transactions
      const pendingBuyerPayments = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'buyer_payment').length : 0
      const pendingFarmerPayments = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'farmer_payment').length : 0
      const pendingCommissions = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'commission').length : 0
      
      // Process users by role
      const farmers = Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'farmer') : []
      const buyers = Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'buyer') : []
      const employees = Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'employee') : []
      
      // Calculate today's revenue from transactions
      const today = new Date().toISOString().split('T')[0]
      const todayTransactions = Array.isArray(transactionsData) ? 
        transactionsData.filter((t: any) => t.date === today || t.created_at?.startsWith(today)) : []
      const todayRevenue = todayTransactions.reduce((sum: number, t: any) => sum + (parseFloat(t.total_amount) || 0), 0)
      
      setStats({
        todayRevenue: todayRevenue || dashboardData.todayRevenue || 0,
        monthlyRevenue: dashboardData.revenue || 0,
        totalCommission: dashboardData.commission || 0,
        pendingCredits: dashboardData.pendingCredits || 0,
        pendingBuyerPayments,
        pendingFarmerPayments,
        pendingCommissionConfirmations: pendingCommissions,
        completedTransactions: dashboardData.completed || transactionsData.length || 0,
        activeStock: dashboardData.activeStock || 0,
        totalFarmers: farmers.length,
        totalBuyers: buyers.length,
        totalEmployees: employees.length
      })
    } catch (error) {
      console.error('Failed to fetch owner dashboard data:', error)
      // Set default values on error
      setStats({
        todayRevenue: 0,
        monthlyRevenue: 0,
        totalCommission: 0,
        pendingCredits: 0,
        pendingBuyerPayments: 0,
        pendingFarmerPayments: 0,
        pendingCommissionConfirmations: 0,
        completedTransactions: 0,
        activeStock: 0,
        totalFarmers: 0,
        totalBuyers: 0,
        totalEmployees: 0
      })
    } finally {
      setLoading(false)
    }
  }



  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    color: string
    trend?: string
    urgent?: boolean
  }> = ({ title, value, icon, color, trend, urgent }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${
      urgent ? 'border-red-500' : 'border-transparent'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className="text-xs text-gray-400 mt-1">{trend}</p>
            )}
          </div>
        </div>
        {urgent && (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your agricultural marketplace efficiently</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Shop: {user?.shop_name || 'Main Shop'}</p>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Financial Overview - Top Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-green-500"
          trend="+12% from yesterday"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-white" />}
          color="bg-blue-500"
          trend="+8% from last month"
        />
        <StatCard
          title="Commission Earned"
          value={`₹${stats.totalCommission.toLocaleString()}`}
          icon={<CreditCard className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Pending Credits"
          value={`₹${stats.pendingCredits.toLocaleString()}`}
          icon={<AlertCircle className="h-6 w-6 text-white" />}
          color="bg-orange-500"
          urgent={stats.pendingCredits > 10000}
        />
      </div>

      {/* Three-Party Completion Status - Core Feature */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Transaction Completion Status</h3>
          <Link to="/transactions" className="text-blue-600 hover:text-blue-800 flex items-center">
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-red-100 p-4 rounded-lg mb-3">
              <Clock className="h-8 w-8 text-red-600 mx-auto" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.pendingBuyerPayments}</p>
            <p className="text-sm text-gray-600">Buyer Payments Pending</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 p-4 rounded-lg mb-3">
              <DollarSign className="h-8 w-8 text-yellow-600 mx-auto" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingFarmerPayments}</p>
            <p className="text-sm text-gray-600">Farmer Payments Pending</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-lg mb-3">
              <CheckCircle className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.pendingCommissionConfirmations}</p>
            <p className="text-sm text-gray-600">Commission Confirmations</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-lg mb-3">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completedTransactions}</p>
            <p className="text-sm text-gray-600">Completed Transactions</p>
          </div>
        </div>
      </div>

      {/* Owner Quick Actions */}
      <OwnerQuickActions />

      {/* Route Test - Remove after testing */}
      <RouteTest />
      
      {/* Owner Workflow - Daily Operations Tracking */}
      <OwnerWorkflow />

      {/* Operational Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Operations</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-medium">Active Stock Items</span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.activeStock}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium">Active Farmers</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats.totalFarmers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium">Active Buyers</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{stats.totalBuyers}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-800">
                    {stats.completedTransactions > 0 
                      ? Math.round((stats.completedTransactions / (stats.completedTransactions + stats.pendingBuyerPayments + stats.pendingFarmerPayments)) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Avg Transaction</p>
                  <p className="text-2xl font-bold text-blue-800">
                    ₹{stats.todayRevenue > 0 && stats.completedTransactions > 0 
                      ? Math.round(stats.todayRevenue / stats.completedTransactions).toLocaleString()
                      : '0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard