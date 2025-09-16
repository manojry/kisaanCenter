import { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  today_sales: number;
  today_transactions: number;
  today_commission: number;
  pending_collections: number;
  farmer_payments_due: number;
  buyer_payments_due: number;
  total_users: number;
  commission_realized: number;
}

export const useOwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    today_sales: 0,
    today_transactions: 0,
    today_commission: 0,
    pending_collections: 0,
    farmer_payments_due: 0,
    buyer_payments_due: 0,
    total_users: 0,
    commission_realized: 0
  });
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch backend-calculated dashboard stats for owner
      const response = await fetch('/api/owner/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const statsData = await response.json();
      setStats(statsData);
      // Optionally, fetch pending transactions if needed (legacy logic)
      setPendingTransactions([]); // Or fetch if you want to show pending transactions
    } catch (err: any) {
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