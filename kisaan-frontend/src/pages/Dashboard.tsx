/**
 * Dashboard page component
 * Role-based dashboard with mobile-first responsive design
 */

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Store, 
  CreditCard, 
  TrendingUp, 
  Package,
  Leaf,
  ShoppingCart,
  Truck,
  AlertCircle
} from 'lucide-react';

// Dashboard stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Role-specific dashboard components
function SuperAdminDashboard({ data }: { data: any }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Shops"
          value={data?.total_shops || 0}
          description="Active shops in system"
          icon={Store}
        />
        <StatCard
          title="Total Users"
          value={data?.total_users || 0}
          description="Registered users"
          icon={Users}
        />
        <StatCard
          title="Total Transactions"
          value={data?.total_transactions || 0}
          description="All time transactions"
          icon={CreditCard}
        />
        <StatCard
          title="System Revenue"
          value={`₹${data?.total_revenue || 0}`}
          description="Total commission earned"
          icon={TrendingUp}
        />
      </div>
    </>
  );
}

function OwnerDashboard({ data }: { data: any }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={`₹${data?.todays_sales || 0}`}
          description="Sales amount today"
          icon={TrendingUp}
        />
        <StatCard
          title="Active Farmers"
          value={data?.active_farmers || 0}
          description="Farmers with stock"
          icon={Users}
        />
        <StatCard
          title="Pending Payments"
          value={`₹${data?.pending_payments || 0}`}
          description="Outstanding amounts"
          icon={CreditCard}
        />
        <StatCard
          title="Commission Earned"
          value={`₹${data?.commission_earned || 0}`}
          description="This month"
          icon={Package}
        />
      </div>
    </>
  );
}

function FarmerDashboard({ data }: { data: any }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Stock Available"
          value={`${data?.stock_quantity || 0} kg`}
          description="Ready for sale"
          icon={Leaf}
        />
        <StatCard
          title="This Month Sales"
          value={`₹${data?.monthly_sales || 0}`}
          description="Total earnings"
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Payments"
          value={`₹${data?.pending_payments || 0}`}
          description="Amount to receive"
          icon={CreditCard}
        />
      </div>
    </>
  );
}

function BuyerDashboard({ data }: { data: any }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="This Month Purchases"
          value={`₹${data?.monthly_purchases || 0}`}
          description="Total spent"
          icon={ShoppingCart}
        />
        <StatCard
          title="Outstanding Credit"
          value={`₹${data?.outstanding_credit || 0}`}
          description="Amount to pay"
          icon={CreditCard}
        />
        <StatCard
          title="Credit Limit"
          value={`₹${data?.credit_limit || 0}`}
          description="Available credit"
          icon={TrendingUp}
        />
      </div>
    </>
  );
}

function EmployeeDashboard({ data }: { data: any }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Transactions"
          value={data?.todays_transactions || 0}
          description="Processed today"
          icon={CreditCard}
        />
        <StatCard
          title="Available Stock"
          value={`${data?.available_stock || 0} items`}
          description="Ready for sale"
          icon={Package}
        />
        <StatCard
          title="Pending Tasks"
          value={data?.pending_tasks || 0}
          description="To be completed"
          icon={AlertCircle}
        />
        <StatCard
          title="Sales Amount"
          value={`₹${data?.sales_amount || 0}`}
          description="Today's total"
          icon={TrendingUp}
        />
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // Mock data for development - replace with real API call later
  const getMockData = () => {
    switch (user?.role) {
      case 'SUPERADMIN':
        return {
          total_shops: 12,
          total_users: 234,
          total_transactions: 1156,
          total_revenue: 245600
        };
      case 'OWNER':
        return {
          todays_sales: 18400,
          active_farmers: 15,
          pending_payments: 45200,
          commission_earned: 12450
        };
      case 'FARMER':
        return {
          stock_quantity: 850,
          monthly_sales: 45200,
          pending_payments: 8500
        };
      case 'BUYER':
        return {
          monthly_purchases: 32100,
          outstanding_credit: 5200,
          credit_limit: 25000
        };
      case 'EMPLOYEE':
        return {
          todays_transactions: 15,
          available_stock: 45,
          pending_tasks: 3,
          sales_amount: 18400
        };
      default:
        return {};
    }
  };
  
  const data = getMockData();
  const isLoading = false;
  const error = null;

  if (!user) {
    return (
      <div className="container px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'Super Administrator';
      case 'OWNER':
        return 'Shop Owner';
      case 'EMPLOYEE':
        return 'Employee';
      case 'FARMER':
        return 'Farmer';
      case 'BUYER':
        return 'Buyer';
      default:
        return role;
    }
  };

  const renderDashboardContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try again.
          </AlertDescription>
        </Alert>
      );
    }

    switch (user.role) {
      case 'SUPERADMIN':
        return <SuperAdminDashboard data={data} />;
      case 'OWNER':
        return <OwnerDashboard data={data} />;
      case 'FARMER':
        return <FarmerDashboard data={data} />;
      case 'BUYER':
        return <BuyerDashboard data={data} />;
      case 'EMPLOYEE':
        return <EmployeeDashboard data={data} />;
      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Dashboard not configured for role: {user.role}
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="container px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user.username} ({getRoleDisplayName(user.role)})
        </p>
      </div>

      {/* Dashboard Content */}
      {renderDashboardContent()}

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used actions for your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.role === 'FARMER' && (
                <>
                  <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Leaf className="h-8 w-8 text-primary-emerald" />
                      <div>
                        <h3 className="font-medium">Add Stock</h3>
                        <p className="text-sm text-muted-foreground">Submit new produce</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Truck className="h-8 w-8 text-primary-emerald" />
                      <div>
                        <h3 className="font-medium">View Sales</h3>
                        <p className="text-sm text-muted-foreground">Check sales history</p>
                      </div>
                    </div>
                  </Card>
                </>
              )}
              
              {user.role === 'BUYER' && (
                <>
                  <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-8 w-8 text-primary-emerald" />
                      <div>
                        <h3 className="font-medium">Browse Products</h3>
                        <p className="text-sm text-muted-foreground">Find fresh produce</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-8 w-8 text-primary-emerald" />
                      <div>
                        <h3 className="font-medium">Make Payment</h3>
                        <p className="text-sm text-muted-foreground">Pay outstanding credit</p>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}