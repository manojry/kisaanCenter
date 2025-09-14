import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Download,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReportsAnalytics from '../components/ReportsAnalytics';
import PDFReportGenerator from '../components/PDFReportGenerator';

export default function Reports() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const [shopRes, usersRes] = await Promise.all([
        apiClient.get(`/shops?owner_id=${user.id}`),
        apiClient.get('/users')
      ]);

      // FIX: Use .data instead of .shops
      const shops = shopRes?.data || [];
      const userShop = shops[0];
      setShop(userShop);

      const allUsers = Array.isArray(usersRes) ? usersRes : (usersRes?.users || []);
      setUsers(allUsers);

      if (!userShop?.id) {
        setError('No shop found for this owner');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shop data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || (user.role !== 'owner' && user.role !== 'superadmin')) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Owner or SuperAdmin role required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm" className="md:hidden">
            <Link to={user.role === 'owner' ? '/owner' : '/dashboard'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
          </div>
        </div>
        
        <p className="text-muted-foreground">
          View detailed analytics and generate PDF reports for {shop?.name || 'your shop'}
        </p>
      </div>

      {/* Reports Content */}
      {shop?.id ? (
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="pdf-reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF Reports
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="mt-6">
            <ReportsAnalytics shopId={shop.id} />
          </TabsContent>
          
          <TabsContent value="pdf-reports" className="mt-6">
            <PDFReportGenerator shopId={shop.id} users={users} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Shop Found</h3>
              <p className="text-muted-foreground">
                Please contact support to set up your shop.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}