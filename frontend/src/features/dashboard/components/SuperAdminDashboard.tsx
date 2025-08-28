import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface SystemOverview {
  total_shops: number;
  active_shops: number;
  total_users: number;
  active_users: number;
  shop_utilization_rate: number;
}

interface FinancialOverview {
  total_revenue: number;
  total_commission: number;
  commission_confirmed: number;
  commission_pending: number;
  commission_rate: number;
}

interface TransactionAnalytics {
  total_transactions: number;
  completed_transactions: number;
  pending_transactions: number;
  partial_transactions: number;
  completion_percentage: number;
}

interface PaymentAnalytics {
  total_buyer_payments: number;
  total_farmer_payments: number;
  payment_gap: number;
}

interface ShopPerformance {
  shop_id: number;
  shop_name: string;
  transaction_count: number;
  revenue: number;
  commission: number;
}

interface RecentActivity {
  new_shops_7_days: number;
  new_users_7_days: number;
  new_transactions_7_days: number;
}

interface PendingActions {
  pending_approvals: number;
  system_alerts: number;
  shops_with_pending_transactions: number;
}

interface SystemHealth {
  api_status: string;
  database_status: string;
  last_updated: string;
}

interface SuperAdminDashboardData {
  system_overview: SystemOverview;
  financial_overview: FinancialOverview;
  transaction_analytics: TransactionAnalytics;
  payment_analytics: PaymentAnalytics;
  shop_performance: ShopPerformance[];
  recent_activity: RecentActivity;
  pending_actions: PendingActions;
  system_health: SystemHealth;
}

const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/v1/dashboard/superadmin');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch superadmin dashboard:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchSuperAdminData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h2>No Data Available</h2>
          <p>Dashboard data is not available at the moment.</p>
          <button onClick={fetchSuperAdminData} className="retry-btn">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <div className="status-indicator status-live">
          <span>🔴</span>
          <span>System Administrator</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Total Revenue Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#10b981' }}>
            💰
          </div>
          <div className="card-content">
            <h3 className="card-title">Total Revenue</h3>
            <p className="card-number">${data.financial_overview.total_revenue.toLocaleString()}</p>
            <span className="card-subtitle">System Wide</span>
          </div>
        </div>

        {/* Total Shops Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#3b82f6' }}>
            🏪
          </div>
          <div className="card-content">
            <h3 className="card-title">Total Shops</h3>
            <p className="card-number">{data.system_overview.total_shops}</p>
            <span className="card-subtitle">{data.system_overview.active_shops} Active</span>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#8b5cf6' }}>
            👥
          </div>
          <div className="card-content">
            <h3 className="card-title">Total Users</h3>
            <p className="card-number">{data.system_overview.total_users}</p>
            <span className="card-subtitle">{data.system_overview.active_users} Active</span>
          </div>
        </div>

        {/* Transaction Completion Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#06b6d4' }}>
            �
          </div>
          <div className="card-content">
            <h3 className="card-title">Transaction Completion</h3>
            <p className="card-number">{data.transaction_analytics.completion_percentage.toFixed(1)}%</p>
            <span className="card-subtitle">{data.transaction_analytics.completed_transactions} / {data.transaction_analytics.total_transactions}</span>
          </div>
        </div>

        {/* Commission Pending Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#f59e0b' }}>
            ⏳
          </div>
          <div className="card-content">
            <h3 className="card-title">Commission Pending</h3>
            <p className="card-number">${data.financial_overview.commission_pending.toLocaleString()}</p>
            <span className="card-subtitle">Requires Confirmation</span>
          </div>
        </div>

        {/* Pending Transactions Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#ef4444' }}>
            🚨
          </div>
          <div className="card-content">
            <h3 className="card-title">Pending Transactions</h3>
            <p className="card-number">{data.transaction_analytics.pending_transactions}</p>
            <span className="card-subtitle">Need Attention</span>
          </div>
        </div>
      </div>

      <div className="dashboard-lower-section">
        {/* Financial Overview */}
        <div className="status-cards">
          <h3>Financial Overview</h3>
          <div className="status-item">
            <span className="status-label">Total Commission</span>
            <span className="status-value">${data.financial_overview.total_commission.toLocaleString()}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Commission Rate</span>
            <span className="status-value">{data.financial_overview.commission_rate.toFixed(2)}%</span>
          </div>
          <div className="status-item">
            <span className="status-label">Payment Gap</span>
            <span className="status-value">${data.payment_analytics.payment_gap.toLocaleString()}</span>
          </div>
          <div className="status-item">
            <span className="status-label">System Health</span>
            <span className="status-value healthy">{data.system_health.api_status}</span>
          </div>
        </div>

        {/* Top Performing Shops */}
        <div className="status-cards">
          <h3>Top Performing Shops</h3>
          <div className="shop-performance-list">
            {data.shop_performance.slice(0, 5).map((shop, index) => (
              <div key={shop.shop_id} className="performance-item">
                <div className="performance-rank">#{index + 1}</div>
                <div className="performance-details">
                  <span className="shop-name">{shop.shop_name}</span>
                  <span className="shop-revenue">${shop.revenue.toLocaleString()}</span>
                </div>
                <div className="performance-transactions">
                  {shop.transaction_count} txns
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="status-cards">
          <h3>Recent Activity (7 Days)</h3>
          <div className="status-item">
            <span className="status-label">New Shops</span>
            <span className="status-value">{data.recent_activity.new_shops_7_days}</span>
          </div>
          <div className="status-item">
            <span className="status-label">New Users</span>
            <span className="status-value">{data.recent_activity.new_users_7_days}</span>
          </div>
          <div className="status-item">
            <span className="status-label">New Transactions</span>
            <span className="status-value">{data.recent_activity.new_transactions_7_days}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Last Updated</span>
            <span className="status-value">
              {new Date(data.system_health.last_updated).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="status-cards">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="action-btn" onClick={() => window.location.href = '/shops'}>
              <span className="action-icon">🏪</span>
              <span>Manage Shops</span>
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/users'}>
              <span className="action-icon">👥</span>
              <span>User Management</span>
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/analytics'}>
              <span className="action-icon">📊</span>
              <span>System Reports</span>
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/settings'}>
              <span className="action-icon">⚙️</span>
              <span>System Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;