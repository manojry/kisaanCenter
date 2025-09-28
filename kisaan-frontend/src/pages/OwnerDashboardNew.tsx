import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOwnerDashboard } from '../hooks/useOwnerDashboard';
import { DashboardStats } from '../components/owner/DashboardStats';
import { QuickActions } from '../components/owner/QuickActions';
import { Section } from '@/components/ui/Section';
import { usePrefetchOnFocus } from '@/hooks/usePrefetchOnFocus';

const OwnerDashboardNew: React.FC = () => {

  const { user } = useAuth();
  const { stats, isLoading, error, refreshData } = useOwnerDashboard();

  // Auto refresh when returning to the tab / window.
  usePrefetchOnFocus(() => {
    if (!isLoading) {
      refreshData();
    }
  });

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
    <div className="p-2 sm:p-6 space-y-4 sm:space-y-6 bg-blue-50 min-h-screen">
      {/* Header - Responsive for mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Owner Dashboard</h1>
        <Button
          onClick={refreshData}
          variant="ghost"
          size="icon"
          disabled={isLoading}
          className="sm:ml-2"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <p className="text-gray-600 text-base sm:text-lg">
        Welcome back, <span className="font-semibold">{user?.username}</span> <span className="hidden sm:inline">•</span> <span className="block sm:inline">Today's business overview</span>
      </p>

      {/* Dashboard Stats - Ensure mobile-friendly layout in child */}
      <Section title="Today's Metrics" description="Live sales & payment status" padded>
        <DashboardStats stats={stats as any} isLoading={isLoading} />
      </Section>

      {/* Quick Actions - Add spacing for mobile */}
      <Section title="Quick Actions" description="Frequent tasks" padded>
        <QuickActions />
      </Section>

      {/* Pending Actions removed for cleaner UI */}
    </div>
  );
};

export default OwnerDashboardNew;