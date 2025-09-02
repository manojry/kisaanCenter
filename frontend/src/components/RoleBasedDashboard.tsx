import DashboardErrorBoundary from './DashboardErrorBoundary';
import { useAuth } from '@/context/AuthContext';
import { User as EntityUser } from '../types/entities';
import { UserRole } from '../types/enums';
import OwnerDashboard from '@/pages/Dashboard';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';

interface PlaceholderDashboardProps {
  role: string;
  message?: string;
}

const PlaceholderDashboard: React.FC<PlaceholderDashboardProps> = ({ role, message }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
      </h2>
      <p className="text-gray-600 mb-4">
        {message || `The ${role} dashboard is currently under development.`}
      </p>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          🔄 Coming soon with full functionality
        </p>
      </div>
    </div>
  </div>
);

const FarmerDashboard = () => (
  <PlaceholderDashboard role="farmer" message="Track your crops, sales, and payments in one place." />
);
const BuyerDashboard = () => (
  <PlaceholderDashboard role="buyer" message="Manage your purchases and supplier relationships." />
);
const EmployeeDashboard = () => (
  <PlaceholderDashboard role="employee" message="Access your assigned tasks and shop operations." />
);
const GuestDashboard = () => (
  <PlaceholderDashboard role="guest" message="Please log in to access your personalized dashboard." />
);

const convertToUser = (authUser: any): EntityUser => {
  if (!authUser) {
    return {
      id: 0,
      username: 'Unknown',
      password_hash: '',
      role: UserRole.SUPERADMIN,
      record_status: 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return {
    id: authUser.id,
    username: authUser.username,
    password_hash: authUser.password_hash ?? '',
    role: authUser.role,
    shop_id: authUser.shop_id === null ? undefined : authUser.shop_id,
    record_status: authUser.record_status ?? 'active',
    created_at: authUser.created_at ?? new Date().toISOString(),
    updated_at: authUser.updated_at ?? new Date().toISOString(),
  };
};

const RoleBasedDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary userRole={user?.role}>
      {(() => {
        switch (user?.role) {
          case 'owner':
            return <OwnerDashboard />;
          case 'farmer':
            return <FarmerDashboard />;
          case 'buyer':
            return <BuyerDashboard />;
          case 'employee':
            return <EmployeeDashboard />;
          case 'superadmin':
            return <SuperAdminDashboard user={convertToUser(user)} />;
          default:
            if (user?.role) {
              console.warn('Unknown user role:', user.role);
            }
            return <GuestDashboard />;
        }
      })()}
    </DashboardErrorBoundary>
  );
};


export default RoleBasedDashboard;
