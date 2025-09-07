/**
 * Dashboard page component
 * Role-based dashboard with mobile-first responsive design
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
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
          title="Total Users"
          value={data?.total_users || 0}
          description="Registered users"
          icon={Users}
        />
        <StatCard
          title="Total Products"
          value={data?.total_products || 0}
          description="Products in your shop(s)"
          icon={Package}
        />
        <StatCard
          title="Total Transactions"
          value={data?.total_transactions || 0}
          description="All time transactions"
          icon={CreditCard}
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
  

  // State for real API data
  const [data, setData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all needed data in parallel
        const [users, products, transactionsResp] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/products'),
          apiClient.get('/transactions'),
        ]);

        // Handle new transactions response structure

        // Type guard for transactions response
        let transactions: any[] = [];
        if (
          transactionsResp &&
          typeof transactionsResp === 'object' &&
          'transactions' in transactionsResp &&
          Array.isArray((transactionsResp as any).transactions)
        ) {
          transactions = (transactionsResp as any).transactions;
        } else if (Array.isArray(transactionsResp)) {
          transactions = transactionsResp;
        }

        setData({
          total_users: Array.isArray(users) ? users.length : 0,
          total_products: Array.isArray(products) ? products.length : 0,
          total_transactions: transactions.length,
          transactions, // Store for possible future use (DTO fields)
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
  switch (role?.toUpperCase()) {
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
            {error}
          </AlertDescription>
        </Alert>
      );
    }

    switch (user.role?.toUpperCase()) {
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
      // No default: do not render anything for unknown roles
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
              {user.role?.toUpperCase() === 'FARMER' && (
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
              
              {user.role?.toUpperCase() === 'BUYER' && (
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