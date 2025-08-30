import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  CheckCircle, Clock, AlertCircle, DollarSign, Users, Package,
  ArrowRight, TrendingUp, Calendar, Target
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'urgent' | 'blocked';
  count?: number;
  route: string;
  icon: React.ReactNode;
}

interface OwnerMetrics {
  pendingBuyerPayments: number;
  pendingFarmerPayments: number;
  pendingCommissions: number;
  todayTransactions: number;
  activeStock: number;
  totalRevenue: number;
}

const OwnerWorkflow: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OwnerMetrics>({
    pendingBuyerPayments: 0,
    pendingFarmerPayments: 0,
    pendingCommissions: 0,
    todayTransactions: 0,
    activeStock: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerMetrics();
  }, []);

  const fetchOwnerMetrics = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const shopId = user.shop_id || 1;
      
      // Fetch incomplete transactions and other metrics with error handling
      const results = await Promise.allSettled([
        apiClient.get('/transactions/completion-status/pending', { params: { shop_id: shopId } }),
        apiClient.get(`/transactions/shop/${shopId}/dashboard`),
        apiClient.get('/transactions', { params: { shop_id: shopId, limit: 50 } })
      ]);
      
      const incompleteData = results[0].status === 'fulfilled' ? results[0].value?.data?.data || [] : [];
      const dashboardData = results[1].status === 'fulfilled' ? results[1].value?.data?.data || {} : {};
      const transactionsData = results[2].status === 'fulfilled' ? results[2].value?.data?.data || [] : [];
      
      const pendingBuyerPayments = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'buyer_payment').length : 0;
      const pendingFarmerPayments = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'farmer_payment').length : 0;
      const pendingCommissions = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'commission').length : 0;
      
      // Calculate today's transactions
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = Array.isArray(transactionsData) ? 
        transactionsData.filter((t: any) => t.date === today || t.created_at?.startsWith(today)).length : 0;
      
      setMetrics({
        pendingBuyerPayments,
        pendingFarmerPayments,
        pendingCommissions,
        todayTransactions: todayTransactions || dashboardData.todayTransactions || 0,
        activeStock: dashboardData.activeStock || 0,
        totalRevenue: dashboardData.revenue || 0
      });
    } catch (error) {
      console.error('Failed to fetch owner metrics:', error);
      setMetrics({
        pendingBuyerPayments: 0,
        pendingFarmerPayments: 0,
        pendingCommissions: 0,
        todayTransactions: 0,
        activeStock: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Define owner's daily workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'morning-review',
      title: 'Morning Stock Review',
      description: 'Check overnight deliveries and stock levels',
      status: metrics.activeStock > 0 ? 'completed' : 'pending',
      count: metrics.activeStock,
      route: '/stock',
      icon: <Package className="h-5 w-5" />
    },
    {
      id: 'process-sales',
      title: 'Process Sales',
      description: 'Handle customer transactions',
      status: metrics.todayTransactions > 0 ? 'completed' : 'pending',
      count: metrics.todayTransactions,
      route: '/transactions',
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      id: 'buyer-payments',
      title: 'Collect Buyer Payments',
      description: 'Process pending buyer payments',
      status: metrics.pendingBuyerPayments === 0 ? 'completed' : 
             metrics.pendingBuyerPayments > 5 ? 'urgent' : 'pending',
      count: metrics.pendingBuyerPayments,
      route: '/payments?filter=buyer_pending',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'farmer-payments',
      title: 'Pay Farmers',
      description: 'Process farmer payment requests',
      status: metrics.pendingFarmerPayments === 0 ? 'completed' : 
             metrics.pendingFarmerPayments > 3 ? 'urgent' : 'pending',
      count: metrics.pendingFarmerPayments,
      route: '/payments?filter=farmer_pending',
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      id: 'confirm-commissions',
      title: 'Confirm Commissions',
      description: 'Review and confirm transaction commissions',
      status: metrics.pendingCommissions === 0 ? 'completed' : 'pending',
      count: metrics.pendingCommissions,
      route: '/transactions?filter=pending_commission',
      icon: <CheckCircle className="h-5 w-5" />
    },
    {
      id: 'end-of-day',
      title: 'End-of-Day Review',
      description: 'Review daily performance and prepare for tomorrow',
      status: 'pending',
      route: '/reports?type=daily',
      icon: <Calendar className="h-5 w-5" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'blocked': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'blocked': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Owner Daily Workflow</h3>
          <p className="text-gray-600 mt-1">Track your daily operations and priorities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">
            {workflowSteps.filter(step => step.status === 'completed').length}/{workflowSteps.length} Complete
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {workflowSteps.map((step, index) => (
          <Link
            key={step.id}
            to={step.route}
            className={`block p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getStatusColor(step.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {getStatusIcon(step.status)}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {step.count !== undefined && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{step.count}</div>
                    <div className="text-xs text-gray-500">
                      {step.status === 'completed' ? 'Done' : 'Pending'}
                    </div>
                  </div>
                )}
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Three-Party Completion Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Three-Party Completion Status</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-red-600">{metrics.pendingBuyerPayments}</div>
            <div className="text-xs text-gray-600">Buyer Payments</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{metrics.pendingFarmerPayments}</div>
            <div className="text-xs text-gray-600">Farmer Payments</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.pendingCommissions}</div>
            <div className="text-xs text-gray-600">Commissions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerWorkflow;