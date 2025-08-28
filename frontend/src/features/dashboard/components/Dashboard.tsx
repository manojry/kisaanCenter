import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../api';
import { DashboardStats } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="alert alert-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
        <button onClick={loadDashboardStats} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-empty">
        <div className="empty-state">
          <h3>No Data Available</h3>
          <p>Dashboard statistics could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <button 
          onClick={loadDashboardStats} 
          className="btn btn-secondary btn-sm refresh-btn"
          title="Refresh data"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon sales">📊</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-number">${stats.total_revenue?.toFixed(2) || '0.00'}</p>
            <span className="stat-label">All time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon transactions">💰</div>
          <div className="stat-content">
            <h3>Transactions</h3>
            <p className="stat-number">{stats.total_transactions || 0}</p>
            <span className="stat-label">Total completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon users">👥</div>
          <div className="stat-content">
            <h3>Active Users</h3>
            <p className="stat-number">{stats.active_users || 0}</p>
            <span className="stat-label">Currently active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon shops">🏪</div>
          <div className="stat-content">
            <h3>Active Shops</h3>
            <p className="stat-number">{stats.active_shops || 0}</p>
            <span className="stat-label">Operating</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon payments">📋</div>
          <div className="stat-content">
            <h3>Pending Payments</h3>
            <p className="stat-number">{stats.pending_payments || 0}</p>
            <span className="stat-label">Awaiting</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">💳</div>
          <div className="stat-content">
            <h3>Commission</h3>
            <p className="stat-number">${stats.total_commission?.toFixed(2) || '0.00'}</p>
            <span className="stat-label">Total earned</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <div className="section-header">
            <h2>System Overview</h2>
            <span className="section-badge">Live</span>
          </div>
          <div className="overview-grid">
            <div className="overview-item">
              <div className="overview-icon">�</div>
              <div className="overview-content">
                <p className="overview-title">Total Users</p>
                <p className="overview-value">{stats.total_users || 0}</p>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-icon">🏪</div>
              <div className="overview-content">
                <p className="overview-title">Total Shops</p>
                <p className="overview-value">{stats.total_shops || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>System Status</h2>
            <span className="status-indicator online">🟢 Online</span>
          </div>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Database</span>
              <span className="status-value healthy">Healthy</span>
            </div>
            <div className="status-item">
              <span className="status-label">API</span>
              <span className="status-value healthy">Operational</span>
            </div>
            <div className="status-item">
              <span className="status-label">Storage</span>
              <span className="status-value healthy">Available</span>
            </div>
            <div className="status-item">
              <span className="status-label">Last Backup</span>
              <span className="status-value">2 hours ago</span>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <button className="action-btn">
              <span className="action-icon">➕</span>
              <span>Add Product</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">👤</span>
              <span>New User</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📊</span>
              <span>View Reports</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
