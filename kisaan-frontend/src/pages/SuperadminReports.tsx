import { reportsApi } from '../services/api';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, RefreshCw, BarChart3, Users, Building2, ShoppingCart } from 'lucide-react';

interface ReportData {
  totalShops: number;
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  activeShops: number;
  activeUsers: number;
  recentTransactions: any[];
  topShops: any[];
}

const SuperadminReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalShops: 0,
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeShops: 0,
    activeUsers: 0,
    recentTransactions: [],
    topShops: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch sales and transactions data in parallel
      const [salesRes, transactionsRes] = await Promise.all([
        reportsApi.getSales(),
        reportsApi.getTransactions()
      ]);
      // Combine results for the report
      setReportData({
        totalShops: salesRes.data?.totalShops || 0,
        activeShops: salesRes.data?.activeShops || 0,
        totalUsers: salesRes.data?.totalUsers || 0,
        activeUsers: salesRes.data?.activeUsers || 0,
        totalTransactions: transactionsRes.data?.totalTransactions || 0,
        totalRevenue: salesRes.data?.totalRevenue || 0,
        recentTransactions: transactionsRes.data?.recentTransactions || [],
        topShops: salesRes.data?.topShops || []
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setReportData({
        totalShops: 0,
        activeShops: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        recentTransactions: [],
        topShops: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const exportReport = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Shops', reportData.totalShops],
      ['Active Shops', reportData.activeShops],
      ['Total Users', reportData.totalUsers],
      ['Active Users', reportData.activeUsers],
      ['Total Transactions', reportData.totalTransactions],
      ['Total Revenue', reportData.totalRevenue]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superadmin-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Reports</h1>
          <p className="text-gray-600">Overview of platform performance and metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchReportData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shops</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalShops}</p>
                <p className="text-xs text-green-600">{reportData.activeShops} active</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalUsers}</p>
                <p className="text-xs text-green-600">{reportData.activeUsers} active</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalTransactions}</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-gray-700">System-wide Metrics</p>
            <p className="text-gray-500 mt-2">
              Superadmin dashboard shows aggregated platform data only.
              Individual transaction details are not accessible for privacy and security.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Platform Commission</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(reportData.totalRevenue * 0.1)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Active Rate</p>
                <p className="text-xl font-bold text-green-800">
                  {reportData.totalShops > 0 ? Math.round((reportData.activeShops / reportData.totalShops) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Shops */}
      <Card>
        <CardHeader>
          <CardTitle>Top Shops</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.topShops.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No shops found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topShops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>#{shop.id}</TableCell>
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>Owner #{shop.owner_id}</TableCell>
                    <TableCell>
                      <Badge className={shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {shop.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(shop.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperadminReports;