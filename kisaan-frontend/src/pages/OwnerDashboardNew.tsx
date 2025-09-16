import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOwnerDashboard } from '../hooks/useOwnerDashboard';
import { DashboardStats } from '../components/owner/DashboardStats';
import { QuickActions } from '../components/owner/QuickActions';
import { PendingActions } from '../components/owner/PendingActions';

const OwnerDashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, pendingTransactions, isLoading, error, refreshData } = useOwnerDashboard();

  const handleViewTransaction = (id: number) => {
    navigate(`/transactions/${id}`);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button 
            onClick={refreshData} 
            variant="outline" 
            size="sm" 
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
  <div className="p-2 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Owner Dashboard</h1>
        <Button
          onClick={refreshData}
          variant="ghost"
          size="icon"
          disabled={isLoading}
          className="ml-2"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <p className="text-gray-600 text-sm sm:text-base">
        Welcome back, {user?.username} • Today's business overview
      </p>

      {/* Dashboard Stats */}
  <DashboardStats stats={stats} isLoading={isLoading} />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <QuickActions />
      </div>

  {/* Pending Actions removed for cleaner UI */}
    </div>
  );
};

export default OwnerDashboardNew;