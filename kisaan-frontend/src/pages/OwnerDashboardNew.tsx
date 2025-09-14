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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Welcome back, {user?.username} • Today's business overview
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={refreshData} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate('/transactions')} 
            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

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