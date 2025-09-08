import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  Calendar,
  ShoppingCart,
  Plus,
  Package
} from 'lucide-react';

interface DashboardStats {
  today_sales: number;
  today_transactions: number;
  today_commission: number;
  pending_collections: number;
  farmer_payments_due: number;
  total_users: number;
}

const OwnerDashboardNew: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    today_sales: 0,
    today_transactions: 0,
    today_commission: 0,
    pending_collections: 0,
    farmer_payments_due: 0,
    total_users: 0
  });
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's data
      const todayResponse = await fetch(`http://localhost:3000/api/transactions/analytics/daily/${today}?shop_id=1`);
      const todayData = await todayResponse.json();
      
      // Fetch pending actions
      const pendingResponse = await fetch('http://localhost:3000/api/transactions?shop_id=1&status=farmer_due,credit,partial');
      const pendingData = await pendingResponse.json();
      
      if (todayData.success) {
        const data = todayData.data;
        setStats({
          today_sales: data.total_sales || 0,
          today_transactions: data.total_transactions || 0,
          today_commission: (data.total_sales || 0) * 0.1,
          pending_collections: 0, // Will calculate from pending data
          farmer_payments_due: 0, // Will calculate from pending data
          total_users: 0
        });
      }
      
      if (pendingData.success) {
        setPendingActions(pendingData.data);
        
        // Calculate pending amounts
        const collections = pendingData.data
          .filter((t: any) => ['credit', 'partial'].includes(t.status))
          .reduce((sum: number, t: any) => sum + (t.total - t.buyer_paid), 0);
          
        const farmerDue = pendingData.data
          .filter((t: any) => t.status === 'farmer_due')
          .reduce((sum: number, t: any) => sum + (t.total - t.commission_amount - t.farmer_paid), 0);
          
        setStats(prev => ({
          ...prev,
          pending_collections: collections,
          farmer_payments_due: farmerDue
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600">Today's business overview</p>
        </div>
        <Button onClick={() => window.location.href = '/transactions'} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          New Transaction
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.today_sales)}</p>
                <p className="text-xs text-gray-500">{stats.today_transactions} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Commission</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.today_commission)}</p>
                <p className="text-xs text-gray-500">Today's earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">To Collect</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending_collections)}</p>
                <p className="text-xs text-gray-500">From buyers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">To Pay</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.farmer_payments_due)}</p>
                <p className="text-xs text-gray-500">To farmers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button onClick={() => window.location.href = '/transactions'} className="h-20 flex-col">
          <ShoppingCart className="h-6 w-6 mb-2" />
          Create Transaction
        </Button>
        <Button onClick={() => window.location.href = '/users'} variant="outline" className="h-20 flex-col">
          <Users className="h-6 w-6 mb-2" />
          Manage Users
        </Button>
        <Button onClick={() => window.location.href = '/products'} variant="outline" className="h-20 flex-col">
          <Package className="h-6 w-6 mb-2" />
          Manage Products
        </Button>
        <Button onClick={() => window.location.href = '/balance'} variant="outline" className="h-20 flex-col">
          <DollarSign className="h-6 w-6 mb-2" />
          Record Payment
        </Button>
      </div>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collections Due */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              Collections Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions
                .filter(t => ['credit', 'partial'].includes(t.status))
                .slice(0, 5)
                .map(transaction => (
                <div key={transaction.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.buyer_name}</p>
                    <p className="text-sm text-gray-600">{transaction.product_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      {formatCurrency(transaction.total - transaction.buyer_paid)}
                    </p>
                    <Badge variant={transaction.status === 'credit' ? 'destructive' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {pendingActions.filter(t => ['credit', 'partial'].includes(t.status)).length === 0 && (
                <p className="text-center text-gray-500 py-4">No pending collections</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Farmer Payments Due */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Users className="w-5 h-5 mr-2" />
              Farmer Payments Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions
                .filter(t => t.status === 'farmer_due')
                .slice(0, 5)
                .map(transaction => (
                <div key={transaction.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.farmer_name}</p>
                    <p className="text-sm text-gray-600">{transaction.product_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatCurrency(transaction.total - transaction.commission_amount - transaction.farmer_paid)}
                    </p>
                    <Badge variant="destructive">Due</Badge>
                  </div>
                </div>
              ))}
              {pendingActions.filter(t => t.status === 'farmer_due').length === 0 && (
                <p className="text-center text-gray-500 py-4">No pending farmer payments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboardNew;