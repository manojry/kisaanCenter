import { useOwnerDashboard } from '../hooks/useOwnerDashboard';
import { useUsers } from '../hooks/useApi';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart3, AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReportsAnalytics from '../components/ReportsAnalytics';
import PDFReportGenerator from '../components/PDFReportGenerator';

export default function Reports() {
  const { user } = useAuth();
  // Get shop and stats from dashboard hook
    const { stats } = useOwnerDashboard();
    // Get all users from users hook
    const { data: usersData } = useUsers();
  // Shop info: for owner, shop is usually user.shop_id or from stats
  // Use stats.shop_name if available, else fallback to 'your shop'
    const shop = user?.role === 'owner' && user?.shop_id
      ? { id: String(user.shop_id), name: 'your shop' }
      : null;
  // If superadmin, shop selection logic may differ (not handled here)
  const users = usersData?.data || [];
  const mappedUsers = users.map(u => ({
    id: String(u.id),
    username: u.username,
    role: u.role
  }));

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
            <ReportsAnalytics shopId={Number(shop.id)} />
          </TabsContent>
          <TabsContent value="pdf-reports" className="mt-6">
            <PDFReportGenerator shopId={shop.id} users={mappedUsers} />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}