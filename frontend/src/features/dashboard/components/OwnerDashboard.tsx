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
  pending_credits: number;
  monthly_expenses: number;
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
    active_employees: 6,
    pending_credits: 2500,
    monthly_expenses: 3200
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOwnerStats();
  }, []);

  const fetchOwnerStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboard/owner`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStats({
            shop_revenue: data.data.shop_overview?.total_revenue || 15000,
            shop_transactions: data.data.shop_overview?.total_transactions || 78,
            shop_products: data.data.shop_overview?.active_products || 45,
            today_transactions: data.data.today_stats?.transactions || 5,
            monthly_growth: '+12%',
            active_employees: data.data.employee_management?.total_employees || 6,
            pending_credits: 2500,
            monthly_expenses: 3200
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch owner stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'transactions', label: 'Sales', icon: '💳' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <OwnerUserManagement />;
      case 'products':
        return (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>Products & Stock</h1>
              <div className="status-indicator status-online">
                <span>📦</span>
                <span>Coming Soon</span>
              </div>
            </div>
            <div className="empty-state">
              <h3>Product Management</h3>
              <p>Product catalog and inventory management features are being developed.</p>
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
              <p>Sales processing and transaction tracking features are being developed.</p>
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
              <h3>Business Analytics</h3>
              <p>Advanced reporting and analytics dashboard is being developed.</p>
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
              <p>Shop settings and configuration options are being developed.</p>
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
            <p>Loading dashboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Shop Overview</h1>
          <p>Monitor your business performance and key metrics</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#3b82f6' }}>
              👥
            </div>
            <div className="card-content">
              <h3 className="card-title">Active Users</h3>
              <p className="card-number">{stats.active_employees}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#10b981' }}>
              📦
            </div>
            <div className="card-content">
              <h3 className="card-title">Products</h3>
              <p className="card-number">{stats.shop_products}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#8b5cf6' }}>
              💳
            </div>
            <div className="card-content">
              <h3 className="card-title">Transactions</h3>
              <p className="card-number">{stats.shop_transactions}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#16a34a' }}>
              💰
            </div>
            <div className="card-content">
              <h3 className="card-title">Revenue</h3>
              <p className="card-number">${stats.shop_revenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#f59e0b' }}>
              📊
            </div>
            <div className="card-content">
              <h3 className="card-title">Credits</h3>
              <p className="card-number">${stats.pending_credits.toLocaleString()}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#ef4444' }}>
              📉
            </div>
            <div className="card-content">
              <h3 className="card-title">Expenses</h3>
              <p className="card-number">${stats.monthly_expenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="dashboard-lower-section">
          <div className="dashboard-section">
            <h3>Today's Activity</h3>
            <div className="status-item">
              <span className="status-label">Morning Review</span>
              <span className="status-value complete">Complete</span>
            </div>
            <div className="status-item">
              <span className="status-label">Sales Processing</span>
              <span className="status-value in-progress">Active</span>
            </div>
            <div className="status-item">
              <span className="status-label">Payment Collection</span>
              <span className="status-value pending">Pending</span>
            </div>
            <div className="status-item">
              <span className="status-label">Stock Updates</span>
              <span className="status-value complete">Complete</span>
            </div>
          </div>

          <div className="dashboard-section">
            <h3>Financial Summary</h3>
            <div className="financial-item">
              <span className="financial-label">Today's Sales</span>
              <span className="financial-value positive">$1,250</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Outstanding Credits</span>
              <span className="financial-value negative">$2,500</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Farmer Payments Due</span>
              <span className="financial-value negative">$1,800</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Net Profit (Month)</span>
              <span className="financial-value positive">$11,800</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="owner-dashboard-layout">
      {/* Compact Sidebar */}
      <div className="owner-navigation">
        <div className="nav-header">
          <h2>KisaanCenter</h2>
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