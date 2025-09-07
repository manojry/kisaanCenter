import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Users as UsersIcon, 
  UserPlus,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AddUserDialog from '../components/AddUserDialog';
import UsersManagement from '../components/UsersManagement';

export default function Users() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const shopRes = await apiClient.get(`/shops?owner_id=${user.id}`);
      const shops = shopRes?.shops || [];
      const userShop = shops[0];
      setShop(userShop);
      
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
            <UsersIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Users Management</h1>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-muted-foreground">
            Manage farmers, buyers, and employees for {shop?.name || 'your shop'}
          </p>
          <Button 
            onClick={() => setShowAddUser(true)}
            className="w-full md:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Users Management Component */}
      {shop?.id ? (
        <UsersManagement shopId={shop.id} onRefresh={fetchShopData} />
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

      {/* Add User Dialog */}
      <AddUserDialog 
        open={showAddUser} 
        onOpenChange={setShowAddUser}
        onSuccess={fetchShopData}
      />
    </div>
  );
}