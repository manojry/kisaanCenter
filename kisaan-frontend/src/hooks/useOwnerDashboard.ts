import { useState, useEffect } from 'react';
import { transactionsApi, paymentsApi } from '../services/api';
import type { Transaction, BusinessSummary } from '../types/api';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  today_sales: number;
  today_transactions: number;
  today_commission: number;
  pending_collections: number;
  farmer_payments_due: number;
  total_users: number;
}

export const useOwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    today_sales: 0,
    today_transactions: 0,
    today_commission: 0,
    pending_collections: 0,
    farmer_payments_due: 0,
    total_users: 0
  });
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.shop_id) {
      setError('No shop associated with user');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch shop transactions
      const transactionsResponse = await transactionsApi.getAll({
        shop_id: user.shop_id
      });

      // Fetch shop users
      let usersResponse: any = { data: [] };
      try {
        const response = await fetch(`/api/users?shop_id=${user.shop_id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (response.ok) {
          usersResponse = await response.json();
        }
      } catch (userError) {
        console.warn('Failed to fetch users:', userError);
      }

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = transactionsResponse.data?.filter(t => {
        const dateStr = typeof t.transaction_date === 'string' && t.transaction_date.length > 0
          ? t.transaction_date
          : (typeof t.created_at === 'string' ? t.created_at : '');
        return dateStr.startsWith(today);
      }) || [];
      
      const pendingTransactions = transactionsResponse.data?.filter(t => 
        t.status === 'pending'
      ) || [];

      let todayStats: DashboardStats = {
        today_sales: Number(todayTransactions.reduce((sum, t) => sum + Number(t.total_sale_value || 0), 0).toFixed(2)),
        today_transactions: todayTransactions.length,
        today_commission: Number(todayTransactions.reduce((sum, t) => sum + Number(t.shop_commission || 0), 0).toFixed(2)),
        pending_collections: Number(pendingTransactions.reduce((sum, t) => sum + Number(t.total_sale_value || 0), 0).toFixed(2)),
        farmer_payments_due: Number((
          pendingTransactions.reduce((sum, t) => sum + Number(t.farmer_earning || 0), 0)
          - pendingTransactions.reduce((sum, t) => {
              if (Array.isArray(t.payments)) {
                return sum + t.payments
                  .filter(p => p.payee_type === 'FARMER' && p.status === 'PAID')
                  .reduce((pSum, p) => pSum + Number(p.amount || 0), 0);
              }
              return sum;
            }, 0)
        ).toFixed(2)),
        total_users: usersResponse.data?.length || 0
      };

      setPendingTransactions(pendingTransactions);
      setStats(todayStats);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.shop_id]);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    pendingTransactions,
    isLoading,
    error,
    refreshData
  };
};