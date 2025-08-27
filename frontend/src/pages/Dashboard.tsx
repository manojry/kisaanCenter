import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types/enums'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Package,
  AlertCircle
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  change?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className="text-sm text-green-600 mt-1">
            +{change} from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
)

const OwnerDashboard: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Shop Dashboard</h1>
      <p className="text-gray-600">Overview of your shop performance</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Sales"
        value="₹2,50,000"
        icon={TrendingUp}
        color="bg-primary-600"
        change="12%"
      />
      <StatCard
        title="Active Users"
        value="75"
        icon={Users}
        color="bg-success-600"
        change="8%"
      />
      <StatCard
        title="Transactions"
        value="150"
        icon={ShoppingCart}
        color="bg-warning-600"
        change="15%"
      />
      <StatCard
        title="Commission"
        value="₹25,000"
        icon={DollarSign}
        color="bg-purple-600"
        change="10%"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">Transaction #{i}001</p>
                <p className="text-sm text-gray-500">Buyer: buyer{i}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">₹{(i * 1500).toLocaleString()}</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-warning-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-warning-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">5 Commissions to Confirm</p>
              <p className="text-sm text-gray-600">Review and confirm pending commissions</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <Package className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Low Stock Alert</p>
              <p className="text-sm text-gray-600">3 products running low on stock</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const FarmerDashboard: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
      <p className="text-gray-600">Manage your stock and track payments</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Active Stock"
        value="1,250 kg"
        icon={Package}
        color="bg-green-600"
      />
      <StatCard
        title="Pending Payments"
        value="₹15,000"
        icon={DollarSign}
        color="bg-warning-600"
      />
      <StatCard
        title="This Month Sales"
        value="₹45,000"
        icon={TrendingUp}
        color="bg-primary-600"
      />
    </div>
  </div>
)

const BuyerDashboard: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
      <p className="text-gray-600">Track your purchases and credit</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="This Month Purchases"
        value="₹35,000"
        icon={ShoppingCart}
        color="bg-blue-600"
      />
      <StatCard
        title="Outstanding Credit"
        value="₹8,500"
        icon={DollarSign}
        color="bg-danger-600"
      />
      <StatCard
        title="Credit Limit"
        value="₹50,000"
        icon={TrendingUp}
        color="bg-success-600"
      />
    </div>
  </div>
)

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case UserRole.OWNER:
    case UserRole.SUPERADMIN:
      return <OwnerDashboard />
    case UserRole.FARMER:
      return <FarmerDashboard />
    case UserRole.BUYER:
      return <BuyerDashboard />
    default:
      return <OwnerDashboard />
  }
}

export default Dashboard