import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDashboardStats } from '../api';
import { DashboardStats } from '../types';
import SuperAdminDashboard from './SuperAdminDashboard';
import OwnerDashboard from './OwnerDashboard';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Dashboard API error:', err);
      setError('Unable to load dashboard data. Please check if the backend server is running.');
      
      // Set fallback/mock data for development
      setStats({
        total_users: 0,
        active_users: 0,
        total_shops: 0,
        active_shops: 0,
        total_transactions: 0,
        total_revenue: 0,
        total_commission: 0,
        pending_payments: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load dashboard stats for non-superadmin users
    if (user?.role !== 'superadmin') {
      loadDashboardStats();
    }
  }, [user]);

  // Route to appropriate dashboard based on user role
  if (user?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  if (user?.role === 'owner') {
    return <OwnerDashboard />;
  }

  // Default dashboard for other roles (farmer, buyer, employee)
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
        <div className="error-actions">
          <button onClick={loadDashboardStats} className="btn btn-primary">
            🔄 Retry Connection
          </button>
          <button onClick={() => {
            setError(null);
            setStats({
              total_users: 0,
              active_users: 0,
              total_shops: 0,
              active_shops: 0,
              total_transactions: 0,
              total_revenue: 0,
              total_commission: 0,
              pending_payments: 0,
            });
          }} className="btn btn-secondary">
            📊 View Offline Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <h3>No Data Available</h3>
          <p>Dashboard statistics could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {error && (
        <div className="dashboard-warning">
          <div className="alert alert-warning">
            <span className="warning-icon">⚠️</span>
            API connection failed. Showing offline dashboard with placeholder data.
            <button onClick={loadDashboardStats} className="retry-btn">
              🔄 Retry
            </button>
          </div>
        </div>
      )}
      
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

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#10b981' }}>
            �
          </div>
          <div className="card-content">
            <h3 className="card-title">Total Revenue</h3>
            <p className="card-number">${stats.total_revenue?.toFixed(2) || '0.00'}</p>
            <span className="card-subtitle">All time</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#3b82f6' }}>
            �
          </div>
          <div className="card-content">
            <h3 className="card-title">Transactions</h3>
            <p className="card-number">{stats.total_transactions || 0}</p>
            <span className="card-subtitle">Total completed</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#8b5cf6' }}>
            👥
          </div>
          <div className="card-content">
            <h3 className="card-title">Active Users</h3>
            <p className="card-number">{stats.active_users || 0}</p>
            <span className="card-subtitle">Currently active</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#06b6d4' }}>
            🏪
          </div>
          <div className="card-content">
            <h3 className="card-title">Active Shops</h3>
            <p className="card-number">{stats.active_shops || 0}</p>
            <span className="card-subtitle">Operating</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#f59e0b' }}>
            📋
          </div>
          <div className="card-content">
            <h3 className="card-title">Pending Payments</h3>
            <p className="card-number">{stats.pending_payments || 0}</p>
            <span className="card-subtitle">Awaiting</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#ef4444' }}>
            💳
          </div>
          <div className="card-content">
            <h3 className="card-title">Commission</h3>
            <p className="card-number">${stats.total_commission?.toFixed(2) || '0.00'}</p>
            <span className="card-subtitle">Total earned</span>
          </div>
        </div>
      </div>

      <div className="dashboard-lower-section">
        <div className="status-cards">
          <h3>System Overview</h3>
          <div className="status-item">
            <span className="status-label">Total Users</span>
            <span className="status-value">{stats.total_users || 0}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Total Shops</span>
            <span className="status-value">{stats.total_shops || 0}</span>
          </div>
          <div className="status-item">
            <span className="status-label">System Health</span>
            <span className="status-value healthy">Excellent</span>
          </div>
        </div>

        <div className="status-cards">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
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
