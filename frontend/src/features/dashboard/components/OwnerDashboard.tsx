import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import './Dashboard.css';

interface OwnerStats {
  shop_revenue: number;
  shop_transactions: number;
  shop_products: number;
  today_transactions: number;
  monthly_growth: string;
  active_employees: number;
}

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerStats>({
    shop_revenue: 15000,
    shop_transactions: 78,
    shop_products: 45,
    today_transactions: 5,
    monthly_growth: '+12%',
    active_employees: 6
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, fetch owner-specific data
    // fetchOwnerStats();
  }, []);

  const fetchOwnerStats = async () => {
    try {
      setLoading(true);
      // const response = await fetch('/api/v1/owner/dashboard');
      // const data = await response.json();
      // setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch owner stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Shop Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Shop Dashboard</h1>
        <div className="status-indicator status-online">
          <span>🏪</span>
          <span>Shop Owner</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Shop Revenue Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#10b981' }}>
            💰
          </div>
          <div className="card-content">
            <h3 className="card-title">Shop Revenue</h3>
            <p className="card-number">${stats.shop_revenue.toLocaleString()}</p>
            <span className="card-subtitle">Total Earned</span>
          </div>
        </div>

        {/* Shop Transactions Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#3b82f6' }}>
            📊
          </div>
          <div className="card-content">
            <h3 className="card-title">Transactions</h3>
            <p className="card-number">{stats.shop_transactions}</p>
            <span className="card-subtitle">Total Count</span>
          </div>
        </div>

        {/* Shop Products Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#8b5cf6' }}>
            📦
          </div>
          <div className="card-content">
            <h3 className="card-title">Products</h3>
            <p className="card-number">{stats.shop_products}</p>
            <span className="card-subtitle">In Inventory</span>
          </div>
        </div>

        {/* Today's Transactions Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#06b6d4' }}>
            📈
          </div>
          <div className="card-content">
            <h3 className="card-title">Today's Sales</h3>
            <p className="card-number">{stats.today_transactions}</p>
            <span className="card-subtitle">Transactions</span>
          </div>
        </div>

        {/* Monthly Growth Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#10b981' }}>
            📈
          </div>
          <div className="card-content">
            <h3 className="card-title">Growth</h3>
            <p className="card-number">{stats.monthly_growth}</p>
            <span className="card-subtitle">This Month</span>
          </div>
        </div>

        {/* Active Employees Card */}
        <div className="dashboard-card">
          <div className="card-icon" style={{ backgroundColor: '#f59e0b' }}>
            👥
          </div>
          <div className="card-content">
            <h3 className="card-title">Active Staff</h3>
            <p className="card-number">{stats.active_employees}</p>
            <span className="card-subtitle">Working Today</span>
          </div>
        </div>
      </div>

      <div className="dashboard-lower-section">
        {/* Shop Management */}
        <div className="status-cards">
          <h3>Shop Management</h3>
          <div className="status-item">
            <span className="status-label">Inventory Status</span>
            <span className="status-value healthy">Well Stocked</span>
          </div>
          <div className="status-item">
            <span className="status-label">Staff Management</span>
            <span className="status-value healthy">Active</span>
          </div>
          <div className="status-item">
            <span className="status-label">Sales Performance</span>
            <span className="status-value healthy">Above Target</span>
          </div>
          <div className="status-item">
            <span className="status-label">Customer Service</span>
            <span className="status-value healthy">Excellent</span>
          </div>
        </div>

        {/* Shop Actions */}
        <div className="status-cards">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="action-btn">
              <span className="action-icon">📦</span>
              <span>Add Product</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">👤</span>
              <span>Manage Staff</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📊</span>
              <span>View Reports</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              <span>Shop Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;