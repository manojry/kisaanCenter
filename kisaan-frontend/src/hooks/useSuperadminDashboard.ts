import { useState, useEffect } from 'react';
import type { Shop, User } from '../types/api';
import config from '../config';

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
      const response = await fetch(`${config.apiBaseUrl}/superadmin/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const dashboardData = await response.json();
      
      // Fetch recent shops separately
      try {
        const shopsResponse = await fetch(`${config.apiBaseUrl}/shops?limit=5`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (shopsResponse.ok) {
          const shopsData = await shopsResponse.json();
          setRecentShops(shopsData.data || []);
        }
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