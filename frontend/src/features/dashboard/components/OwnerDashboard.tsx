import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import OwnerUserManagement from './OwnerUserManagement';
import './Dashboard.css';

interface OwnerStats {
  shop_revenue: number;
  shop_transactions: number;
  shop_products: number;
  today_transactions: number;
  monthly_growth: string;
  active_employees: number;
}

type OwnerView = 'dashboard' | 'users' | 'products' | 'transactions' | 'reports' | 'settings';

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<OwnerView>('dashboard');
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
    fetchOwnerStats();
  }, []);

  const fetchOwnerStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/owner/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          shop_revenue: data.financial_metrics?.net_profit || 15000,
          shop_transactions: data.sales_metrics?.total_transactions || 78,
          shop_products: data.inventory_metrics?.total_products || 45,
          today_transactions: data.sales_metrics?.total_transactions || 5,
          monthly_growth: '+12%',
          active_employees: data.user_metrics?.total_employees || 6
        });
      }
    } catch (error) {
      console.error('Failed to fetch owner stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'products', label: 'Products & Stock', icon: '📦' },
    { id: 'transactions', label: 'Sales & Transactions', icon: '💳' },
    { id: 'reports', label: 'Analytics & Reports', icon: '📈' },
    { id: 'settings', label: 'Shop Settings', icon: '⚙️' }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <OwnerUserManagement />;
      case 'products':
        return (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>Products & Stock Management</h1>
              <div className="status-indicator status-online">
                <span>📦</span>
                <span>Coming Soon</span>
              </div>
            </div>
            <div className="empty-state">
              <h3>Product Management</h3>
              <p>Product catalog and stock management features will be available soon.</p>
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>Sales & Transactions</h1>
              <div className="status-indicator status-online">
                <span>💳</span>
                <span>Coming Soon</span>
              </div>
            </div>
            <div className="empty-state">
              <h3>Transaction Management</h3>
              <p>Sales transaction recording and management features will be available soon.</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>Analytics & Reports</h1>
              <div className="status-indicator status-online">
                <span>📈</span>
                <span>Coming Soon</span>
              </div>
            </div>
            <div className="empty-state">
              <h3>Analytics Dashboard</h3>
              <p>Advanced analytics and reporting features will be available soon.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>Shop Settings</h1>
              <div className="status-indicator status-online">
                <span>⚙️</span>
                <span>Coming Soon</span>
              </div>
            </div>
            <div className="empty-state">
              <h3>Shop Configuration</h3>
              <p>Shop settings and administrative features will be available soon.</p>
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
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
              <button 
                className="action-btn"
                onClick={() => setActiveView('products')}
              >
                <span className="action-icon">📦</span>
                <span>Add Product</span>
              </button>
              <button 
                className="action-btn"
                onClick={() => setActiveView('users')}
              >
                <span className="action-icon">👤</span>
                <span>Manage Staff</span>
              </button>
              <button 
                className="action-btn"
                onClick={() => setActiveView('reports')}
              >
                <span className="action-icon">📊</span>
                <span>View Reports</span>
              </button>
              <button 
                className="action-btn"
                onClick={() => setActiveView('settings')}
              >
                <span className="action-icon">⚙️</span>
                <span>Shop Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="owner-dashboard-layout">
      {/* Navigation Sidebar */}
      <div className="owner-navigation">
        <div className="nav-header">
          <h2>Owner Panel</h2>
          <p>{user?.username}</p>
        </div>
        <nav className="nav-menu">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id as OwnerView)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="owner-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default OwnerDashboard;