import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import './Dashboard.css';

interface SuperAdminStats {
  total_shops: number;
  total_users: number;
  total_revenue: number;
  active_users: number;
  pending_approvals: number;
  system_alerts: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  // Top-level guard: only allow superadmin
  if (!user || user.role !== 'superadmin') {
    return (
      <div className="dashboard-container">
        <div className="alert alert-warning">
          <span className="warning-icon">⚠️</span>
          Access denied. Only superadmin users can view this dashboard.
        </div>
      </div>
    );
  }

  const [stats] = useState<SuperAdminStats>({
    total_shops: 5,
    total_users: 125,
    total_revenue: 50000,
    active_users: 98,
    pending_approvals: 8,
    system_alerts: 2
  });
  const [loading] = useState(false);

  useEffect(() => {
    // Only fetch superadmin-specific data here, not owner/shop data
    // fetchSuperAdminStats();
  }, []);

  // const fetchSuperAdminStats = async () => {
  //   try {
  //     setLoading(true);
  //     // const response = await fetch('/api/v1/admin/dashboard');
  //     // const data = await response.json();
  //     // setStats(data.data);
  //   } catch (error) {
  //     console.error('Failed to fetch superadmin stats:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
            <p className="card-number">${stats.total_revenue.toLocaleString()}</p>
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
            <p className="card-number">{stats.total_shops}</p>
            <span className="card-subtitle">Registered</span>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#8b5cf6' }}>
            👥
          </div>
          <div className="card-content">
            <h3 className="card-title">Total Users</h3>
            <p className="card-number">{stats.total_users}</p>
            <span className="card-subtitle">All Roles</span>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#06b6d4' }}>
            🟢
          </div>
          <div className="card-content">
            <h3 className="card-title">Active Users</h3>
            <p className="card-number">{stats.active_users}</p>
            <span className="card-subtitle">Currently Online</span>
          </div>
        </div>

        {/* Pending Approvals Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#f59e0b' }}>
            ⏳
          </div>
          <div className="card-content">
            <h3 className="card-title">Pending Approvals</h3>
            <p className="card-number">{stats.pending_approvals}</p>
            <span className="card-subtitle">Require Action</span>
          </div>
        </div>

        {/* System Alerts Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#ef4444' }}>
            🚨
          </div>
          <div className="card-content">
            <h3 className="card-title">System Alerts</h3>
            <p className="card-number">{stats.system_alerts}</p>
            <span className="card-subtitle">Critical Issues</span>
          </div>
        </div>
      </div>

      <div className="dashboard-lower-section">
        {/* System Overview */}
        <div className="status-cards">
          <h3>System Management</h3>
          <div className="status-item">
            <span className="status-label">All Shops Control</span>
            <span className="status-value healthy">Available</span>
          </div>
          <div className="status-item">
            <span className="status-label">User Management</span>
            <span className="status-value healthy">Active</span>
          </div>
          <div className="status-item">
            <span className="status-label">Financial Oversight</span>
            <span className="status-value healthy">Monitored</span>
          </div>
          <div className="status-item">
            <span className="status-label">System Health</span>
            <span className="status-value healthy">Excellent</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="status-cards">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="action-btn">
              <span className="action-icon">🏪</span>
              <span>Manage Shops</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">👥</span>
              <span>User Management</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📊</span>
              <span>System Reports</span>
            </button>
            <button className="action-btn">
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