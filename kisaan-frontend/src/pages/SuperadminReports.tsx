import { reportsApi } from '../services/api';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3, Users, Building2, ShoppingCart } from 'lucide-react';

interface ReportData {
  totalShops: number;
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  totalCommission: number;
  activeShops: number;
  activeUsers: number;
  shopStats: { [key: string]: unknown }[];
  userStats: { [key: string]: unknown }[];
}

const SuperadminReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalShops: 0,
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalCommission: 0,
    activeShops: 0,
    activeUsers: 0,
    shopStats: [],
    userStats: []
  });
  const [isLoading, setIsLoading] = useState(true);
  // No date range, only platform-level metrics

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
  const res = await reportsApi.getSuperadminDashboard();
    const metrics = res.data && typeof res.data === 'object' && 'metrics' in res.data && typeof res.data.metrics === 'object' ? res.data.metrics as Record<string, unknown> : {};
    const charts = res.data && typeof res.data === 'object' && 'charts' in res.data && typeof res.data.charts === 'object' ? res.data.charts as Record<string, unknown> : {};
    function getNumber(val: unknown): number {
      return typeof val === 'number' ? val : 0;
    }
    function getArray(val: unknown): { [key: string]: unknown }[] {
      return Array.isArray(val) ? val as { [key: string]: unknown }[] : [];
    }
    setReportData({
      totalShops: getNumber(metrics.totalShops),
      activeShops: getNumber(metrics.activeShops),
      totalUsers: getNumber(metrics.totalUsers),
      activeUsers: getNumber(metrics.activeUsers),
      totalTransactions: getNumber(metrics.totalTransactions),
      totalRevenue: getNumber(metrics.totalRevenue),
      totalCommission: getNumber(metrics.totalCommission),
      shopStats: getArray(charts.shopStats),
      userStats: getArray(charts.userStats)
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
        totalCommission: 0,
        shopStats: [],
        userStats: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  // Remove exportReport and dateRange logic for now

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Reports</h1>
          <p className="text-gray-600">Overview of platform performance and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchReportData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
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
                <p className="text-xl font-bold text-blue-800">{formatCurrency(reportData.totalCommission)}</p>
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

  {/* Remove Top Shops section, as backend does not provide it */}
    </div>
  );
};

export default SuperadminReports;