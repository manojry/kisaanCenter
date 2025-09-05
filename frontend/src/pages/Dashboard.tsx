import React, { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
// Fallback ErrorBoundary
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => <>{children}</>;
import { Link } from 'react-router-dom'
import { dashboardApi } from '@/features/dashboard/api'
import { useDashboardCache } from '@/hooks/useDashboardCache'
import { transactionApi } from '@/features/transaction/api'
import { useAuth } from '@/context/AuthContext'
import OwnerDashboard from '@/features/owner/OwnerDashboard'
// Fallback OwnerWorkflow
const OwnerWorkflow = () => null;
// Fallback OwnerQuickActions
const OwnerQuickActions = () => null;
// Fallback RouteTest
const RouteTest = () => null;
import { 
  Users, Package, ShoppingCart, CreditCard, DollarSign, TrendingUp, 
  AlertCircle, CheckCircle, Clock, ArrowRight 
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
  const { user } = useAuth();
  const { get, set, clear } = useDashboardCache<OwnerDashboardStats>();
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
    totalEmployees: 0,
  });
  const [loading, setLoading] = useState(true);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchOwnerDashboardData = useCallback(async () => {
  if (!user?.shop_id) return;
  const shopId = user.shop_id;
    const cacheKey = `owner-dashboard-${shopId}`;
    try {
      setLoading(true);
      // Try to get cached data first
      const cached = get(cacheKey);
      if (cached) {
        setStats(cached);
        setLoading(false);
        return;
      }
      // Fetch fresh data
      const results = await Promise.allSettled([
        dashboardApi.getShopDashboard(String(shopId)),
        transactionApi.getIncompleteTransactions(Number(shopId)),
        transactionApi.getTransactions({ shop_id: Number(shopId) })
      ]);
      const dashboardData = results[0].status === 'fulfilled' ? results[0].value?.data : undefined;
      const incompleteData = results[1].status === 'fulfilled' ? results[1].value?.data : undefined;
      const transactionsData = results[2].status === 'fulfilled' ? results[2].value?.data : undefined;
      const pendingBuyerPayments = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'buyer_payment').length : 0;
      const pendingFarmerPayments = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'farmer_payment').length : 0;
      const pendingCommissions = Array.isArray(incompleteData) ? 
        incompleteData.filter((t: any) => t.action_required === 'commission').length : 0;
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = Array.isArray(transactionsData) ? 
        transactionsData.filter((t: any) => t.date === today || t.created_at?.startsWith(today)) : [];
      const todayRevenue = todayTransactions.reduce((sum: number, t: any) => sum + (parseFloat(t.total_amount) || 0), 0);
      const newStats: OwnerDashboardStats = {
        todayRevenue: todayRevenue || dashboardData?.summary?.totalRevenue || 0,
        monthlyRevenue: dashboardData?.summary?.totalRevenue || 0,
        totalCommission: dashboardData?.summary?.totalCommission || 0,
        pendingCredits: 0,
        pendingBuyerPayments: pendingBuyerPayments,
        pendingFarmerPayments: pendingFarmerPayments,
        pendingCommissionConfirmations: pendingCommissions,
        completedTransactions: dashboardData?.summary?.totalTransactions || (transactionsData ? transactionsData.length : 0),
        activeStock: 0,
        totalFarmers: 0,
        totalBuyers: 0,
        totalEmployees: 0,
      };
      setStats(newStats);
      set(cacheKey, newStats);
    } catch (error) {
      console.error('Failed to fetch owner dashboard data:', error);
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
        totalEmployees: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.shop_id, get, set]);

  useEffect(() => {
    fetchOwnerDashboardData();
    const interval = setInterval(fetchOwnerDashboardData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchOwnerDashboardData]);

  // Real-time updates via WebSocket
  useWebSocket(
    user?.shop_id ? `ws://localhost:8000/ws/shop/${user.shop_id}/dashboard` : '',
    useCallback(() => {
      clear(); // Clear cache on real-time update
      fetchOwnerDashboardData();
    }, [clear, fetchOwnerDashboardData])
  );

  console.log('Dashboard component rendered', user);
  // ...existing code...



  // Memoize dashboard metrics for performance (can be used in UI enhancements)
  // const dashboardMetrics = useMemo(() => {
  //   const totalPending = stats.pendingBuyerPayments + stats.pendingFarmerPayments + stats.pendingCommissionConfirmations;
  //   const completionRate = stats.completedTransactions > 0 
  //     ? Math.round((stats.completedTransactions / (stats.completedTransactions + totalPending)) * 100)
  //     : 0;
  //   const avgTransaction = stats.todayRevenue > 0 && stats.completedTransactions > 0 
  //     ? Math.round(stats.todayRevenue / stats.completedTransactions)
  //     : 0;
  //   return {
  //     totalPending,
  //     completionRate,
  //     avgTransaction,
  //     isHighPendingCredits: stats.pendingCredits > 10000,
  //   };
  // }, [stats]);

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
  );

  if (user?.role === 'owner') {
    return <OwnerDashboard />;
  }
}

export default function DashboardWithBoundary(props: any) {
  return (
    <ErrorBoundary>
      <Dashboard {...props} />
    </ErrorBoundary>
  );
}