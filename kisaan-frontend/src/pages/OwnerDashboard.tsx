import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Plus,
  AlertCircle,
  DollarSign,
  ShoppingCart,
  UserPlus
} from 'lucide-react';
import AddUserDialog from '../components/AddUserDialog';
import { formatCurrency, formatNumber } from '../lib/formatters';
import CreateTransactionDialog from '../components/CreateTransactionDialog';
import TransactionsList from '../components/TransactionsList';
import UsersManagement from '../components/UsersManagement';
import ProductsManagement from '../components/ProductsManagement';
import ReportsAnalytics from '../components/ReportsAnalytics';

interface DashboardStats {
  total_users: number;
  total_transactions: number;
  total_sales: number;
  total_commission: number;
  total_deficit: number;
  farmers_count: number;
  buyers_count: number;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_transactions: 0,
    total_sales: 0,
    total_commission: 0,
    total_deficit: 0,
    farmers_count: 0,
    buyers_count: 0
  });
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // First fetch shop details for this owner
      const shopRes = await apiClient.get(`/shops?owner_id=${user.id}`);
      const shops = shopRes?.shops || [];
      const userShop = shops[0]; // Owner should have one shop
      setShop(userShop);
      
      if (!userShop?.id) {
        setError('No shop found for this owner');
        return;
      }
      
      const [usersRes, transactionsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get(`/transactions?shop_id=${userShop.id}&include_analytics=true`)
      ]);

      const users = Array.isArray(usersRes) ? usersRes : (usersRes?.users || []);
      const transactionsData = transactionsRes?.data || [];
      const analytics = transactionsRes?.analytics || {};
      
      // Use analytics data for stats
      const totalSales = analytics.total_sales || 0;
      const totalCommission = analytics.total_commission || 0;
      const totalDeficit = analytics.total_deficit || 0;

      setStats({
        total_users: users.length,
        total_transactions: analytics.total_transactions || transactionsData.length,
        total_sales: totalSales,
        total_commission: totalCommission,
        total_deficit: totalDeficit,
        farmers_count: users.filter((u: any) => u.role === 'farmer').length,
        buyers_count: users.filter((u: any) => u.role === 'buyer').length
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'owner') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Owner role required.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 min-w-0">
              <span>KisaanCenter</span>
              <span>/</span>
              <span className="truncate">{shop?.name || 'Owner Dashboard'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold truncate">{shop?.name || 'Dashboard'}</h1>
            <p className="text-muted-foreground text-sm md:text-base truncate">
              {shop?.address || 'Complete shop management - transactions, users, products & reports'}
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/new-transaction'}
            size="sm"
            className="bg-green-600 hover:bg-green-700 px-3 py-2 text-sm flex items-center whitespace-nowrap ml-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="truncate">Record Sale</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
  <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-4 mb-4 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(stats.total_sales)}</div>
            <p className="text-[11px] text-muted-foreground">
              {stats.total_transactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(stats.total_commission)}</div>
            <p className="text-[11px] text-muted-foreground">
              From all transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(stats.total_deficit)}</div>
            <p className="text-[11px] text-muted-foreground">
              To be collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatNumber(stats.total_users)}</div>
            <p className="text-[11px] text-muted-foreground">
              {stats.farmers_count} farmers, {stats.buyers_count} buyers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Hidden on mobile, shown in hamburger menu */}
      <Card className="mb-6 md:mb-8 hidden md:block">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks for shop management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setShowCreateTransaction(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
            <Button onClick={() => setShowAddUser(true)} variant="outline" size="lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <div className="border-b border-border mb-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-transparent h-auto p-0 gap-0">
            <TabsTrigger 
              value="transactions" 
              className="flex items-center gap-1 md:gap-2 py-3 px-2 md:px-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs md:text-sm"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden xs:inline md:hidden">Sales</span>
              <span className="hidden md:inline">Transactions</span>
              <span className="xs:hidden">💳</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-1 md:gap-2 py-3 px-2 md:px-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs md:text-sm"
            >
              <Users className="h-4 w-4" />
              <span className="hidden xs:inline">Users</span>
              <span className="xs:hidden">👥</span>
            </TabsTrigger>
            <TabsTrigger 
              value="products" 
              className="flex items-center gap-1 md:gap-2 py-3 px-2 md:px-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs md:text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden xs:inline">Products</span>
              <span className="xs:hidden">📦</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-1 md:gap-2 py-3 px-2 md:px-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs md:text-sm"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden xs:inline">Reports</span>
              <span className="xs:hidden">📊</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="transactions" className="mt-4 md:mt-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
            <h2 className="text-lg md:text-xl font-semibold">Recent Transactions</h2>
            <Button 
              onClick={() => window.location.href = '/new-transaction'}
              className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </div>
          <TransactionsList shopId={shop?.id} onRefresh={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="users" className="mt-4 md:mt-6">
          <UsersManagement shopId={shop?.id} onRefresh={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="products" className="mt-4 md:mt-6">
          <ProductsManagement shopId={shop?.id} onRefresh={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 md:mt-6">
          <ReportsAnalytics shopId={shop?.id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddUserDialog 
        open={showAddUser} 
        onOpenChange={setShowAddUser}
        onSuccess={fetchDashboardData}
      />
      <CreateTransactionDialog 
        open={showCreateTransaction} 
        onOpenChange={setShowCreateTransaction}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}