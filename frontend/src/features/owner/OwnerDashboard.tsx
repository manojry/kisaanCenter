import React, { useEffect, useState } from 'react'
import { 
  Users, Package, ShoppingCart, CreditCard, DollarSign, TrendingUp, 
  AlertCircle, CheckCircle, Clock, RefreshCw, Eye, Settings,
  BarChart3, PieChart, Activity, Calendar
} from 'lucide-react'
import { dashboardApi } from '@/features/dashboard/api'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLoading, useNotifications } from '@/context/AppStateContext'
import OwnerTransactionManager from './OwnerTransactionManager'

interface OwnerDashboardStats {
  todayRevenue: number
  monthlyRevenue: number
  totalCommission: number
  pendingCredits: number
  pendingBuyerPayments: number
  pendingFarmerPayments: number
  pendingCommissionConfirmations: number
  completedTransactions: number
  activeStock: number
  totalFarmers: number
  totalBuyers: number
  totalEmployees: number
}

const OwnerDashboard: React.FC = () => {
  const [shopInfo, setShopInfo] = useState<any | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions'>('dashboard');
  const { user } = useAuth()
  const { setLoading, isLoading } = useLoading()
  const { addNotification } = useNotifications()
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
  const [loading, setLoadingState] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchOwnerShopInfo = async () => {
    console.log('dashboard --->', user);
    if (!user?.shop_id || !user?.id) return;
    try {
      const { apiClient } = await import('@/services/api');
      const shopRes = await apiClient.get(`/shops/${user.shop_id}`);
      setShopInfo(shopRes.data || null);
    } catch (err) {
      console.error('Failed to fetch shop info:', err);
      setShopInfo(null);
    }
  };

  useEffect(() => {
    fetchOwnerDashboardData();
    fetchOwnerShopInfo();
  }, [])

  const fetchOwnerDashboardData = async () => {
    if (!user?.shop_id) {
      console.log('No shop_id found for user:', user);
      return;
    }
    try {
      setLoading('dashboard', true);
      const shopId = String(user.shop_id);
      console.log('Fetching dashboard data for shop_id:', shopId);
      const dashboardRes = await dashboardApi.getShopDashboard(shopId);
      console.log('Dashboard API response:', dashboardRes);
      const d = dashboardRes.data as any || {};
      console.log('Dashboard data:', d);
      
      // Handle analytics response structure
      const newStats = {
        todayRevenue: d.total_sales || 0,
        monthlyRevenue: d.total_sales || 0,
        totalCommission: d.total_commission || 0,
        pendingCredits: d.credit_count || 0,
        pendingBuyerPayments: 0,
        pendingFarmerPayments: 0,
        pendingCommissionConfirmations: 0,
        completedTransactions: d.completed_count || 0,
        activeStock: 0,
        totalFarmers: 0,
        totalBuyers: 0,
        totalEmployees: 0
      };
      console.log('Setting stats:', newStats);
      setStats(newStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard API error:', error);
      addNotification({
        type: 'error',
        title: 'Dashboard Error',
        message: 'Failed to load dashboard data. Please refresh the page.'
      });
    } finally {
      setLoading('dashboard', false);
      setLoadingState(false);
    }
  };

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    trend?: string
    urgent?: boolean
    onClick?: () => void
  }> = ({ title, value, icon, trend, urgent, onClick }) => (
    <div 
      className={`bg-white p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
        urgent ? 'border-l-4 border-l-red-500' : 'border-gray-200'
      } ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend}</p>
            )}
          </div>
        </div>
        {urgent && (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
    </div>
  )

  const QuickAction: React.FC<{
    title: string
    description: string
    icon: React.ReactNode
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }> = ({ title, description, icon, onClick, variant = 'secondary' }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border text-left transition-all duration-200 hover:shadow-md ${
        variant === 'primary' 
          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          variant === 'primary' ? 'bg-blue-100' : 'bg-gray-50'
        }`}>
          {icon}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  )

  if (isLoading('dashboard') || loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show Transaction Manager if in transactions view
  if (activeView === 'transactions') {
    return <OwnerTransactionManager />
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {user && 'shop_name' in user ? (user as any).shop_name : 'Main Shop'} • {new Date().toLocaleDateString()}
          </p>
          {shopInfo && (
            <div className="mt-2 p-2 border rounded bg-white">
              <div><strong>Shop Name:</strong> {shopInfo.name}</div>
              <div><strong>Location:</strong> {shopInfo.location}</div>
              <div><strong>Commission Rate:</strong> {shopInfo.commission_rate}%</div>
              <div><strong>Status:</strong> {shopInfo.status}</div>
              <button
                onClick={fetchOwnerShopInfo}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Shop Info
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeView === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('transactions')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeView === 'transactions' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Transactions
            </button>
          </div>
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchOwnerDashboardData}
            disabled={isLoading('dashboard')}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading('dashboard') ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          trend="Daily earnings"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-blue-600" />}
          trend="This month"
        />
        <StatCard
          title="Commission Earned"
          value={`₹${stats.totalCommission.toLocaleString()}`}
          icon={<CreditCard className="h-5 w-5 text-purple-600" />}
          trend="Total commission"
        />
        <StatCard
          title="Pending Actions"
          value={stats.pendingBuyerPayments + stats.pendingFarmerPayments + stats.pendingCommissionConfirmations}
          icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
          urgent={(stats.pendingBuyerPayments + stats.pendingFarmerPayments + stats.pendingCommissionConfirmations) > 0}
        />
        <StatCard
          title="Completed Transactions"
          value={stats.completedTransactions}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          trend="All time"
        />
        <StatCard
          title="Active Stock"
          value={stats.activeStock}
          icon={<Package className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Total Farmers"
          value={stats.totalFarmers}
          icon={<Users className="h-5 w-5 text-green-700" />}
        />
        <StatCard
          title="Total Buyers"
          value={stats.totalBuyers}
          icon={<ShoppingCart className="h-5 w-5 text-orange-700" />}
        />
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Activity className="h-5 w-5 text-gray-700" />}
        />
      </div>

      {/* Transaction Status Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Transaction Status</h3>
          <Link 
            to="/transactions" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            View All <Eye className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <Clock className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.pendingBuyerPayments}</p>
            <p className="text-sm text-gray-600">Buyer Payments</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingFarmerPayments}</p>
            <p className="text-sm text-gray-600">Farmer Payments</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.pendingCommissionConfirmations}</p>
            <p className="text-sm text-gray-600">Commission Pending</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.completedTransactions}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            title="New Transaction"
            description="Create a new sale transaction"
            icon={<ShoppingCart className="h-5 w-5 text-blue-600" />}
            onClick={() => setActiveView('transactions')}
            variant="primary"
          />
          <QuickAction
            title="Manage Users"
            description="Add or edit farmers, buyers, employees"
            icon={<Users className="h-5 w-5 text-gray-600" />}
            onClick={() => window.location.href = '/users'}
          />
          <QuickAction
            title="View Reports"
            description="Analytics and business insights"
            icon={<BarChart3 className="h-5 w-5 text-gray-600" />}
            onClick={() => window.location.href = '/reports'}
          />
          <QuickAction
            title="Manage Stock"
            description="Update product inventory"
            icon={<Package className="h-5 w-5 text-gray-600" />}
            onClick={() => window.location.href = '/stock'}
          />
          <QuickAction
            title="Settings"
            description="Shop and system configuration"
            icon={<Settings className="h-5 w-5 text-gray-600" />}
            onClick={() => window.location.href = '/settings'}
          />
          <QuickAction
            title="Activity Log"
            description="Recent system activities"
            icon={<Activity className="h-5 w-5 text-gray-600" />}
            onClick={() => window.location.href = '/activity'}
          />
        </div>
      </div>

      {/* Business Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium">Active Farmers</span>
              </div>
              <span className="text-lg font-semibold text-blue-600">{stats.totalFarmers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium">Active Buyers</span>
              </div>
              <span className="text-lg font-semibold text-green-600">{stats.totalBuyers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium">Stock Items</span>
              </div>
              <span className="text-lg font-semibold text-purple-600">{stats.activeStock}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-orange-600 mr-3" />
                <span className="font-medium">Employees</span>
              </div>
              <span className="text-lg font-semibold text-orange-600">{stats.totalEmployees}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Completion Rate</p>
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
                  <p className="text-sm text-blue-700 font-medium">Avg Transaction Value</p>
                  <p className="text-2xl font-bold text-blue-800">
                    ₹{stats.todayRevenue > 0 && stats.completedTransactions > 0 
                      ? Math.round(stats.todayRevenue / stats.completedTransactions).toLocaleString()
                      : '0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Commission Rate</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {stats.monthlyRevenue > 0 
                      ? ((stats.totalCommission / stats.monthlyRevenue) * 100).toFixed(1)
                      : '0'}%
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerDashboard
