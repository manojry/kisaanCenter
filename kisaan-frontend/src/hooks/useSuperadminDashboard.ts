import { useState, useEffect } from 'react';
import type { Shop, User } from '../types/api';
import { superadminDashboardApi } from '../services/api';

interface SuperadminStats {
  total_shops: number;
  total_owners: number;
  total_users: number;
  total_revenue: number;
  active_shops: number;
  pending_settlements: number;
}

export const useSuperadminDashboard = () => {
  const [stats, setStats] = useState<SuperadminStats>({
    total_shops: 0,
    total_owners: 0,
    total_users: 0,
    total_revenue: 0,
    active_shops: 0,
    pending_settlements: 0
  });
  const [recentShops, setRecentShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the dedicated superadmin dashboard endpoint
      const dashboardData = await superadminDashboardApi.getDashboard();
      // Fetch recent shops separately
      try {
        const recentShopsData = await superadminDashboardApi.getRecentShops();
        setRecentShops(recentShopsData);
      } catch (shopError) {
        console.warn('Failed to fetch recent shops:', shopError);
        setRecentShops([]);
      }

      // Map backend response to frontend format
      const calculatedStats: SuperadminStats = {
        total_shops: dashboardData.data.metrics.totalShops,
        total_users: dashboardData.data.metrics.totalUsers,
        total_owners: dashboardData.data.charts.userStats.find((u: any) => u.role === 'owner')?.count || 0,
        total_revenue: dashboardData.data.metrics.totalRevenue,
        active_shops: dashboardData.data.metrics.activeShops,
        pending_settlements: dashboardData.data.metrics.totalCommission
      };

      setStats(calculatedStats);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    recentShops,
    isLoading,
    error,
    refreshData
  };
};