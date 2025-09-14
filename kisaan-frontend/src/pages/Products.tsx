import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { fetchOwnerShop } from '../utils/shopUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Package, 
  Plus,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductsManagement from '../components/ProductsManagement';
import AddProductDialog from '../components/AddProductDialog';

export default function Products() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    if (!user?.id) return;
    
  // setIsLoading(true); // removed unused isLoading
    try {
      const userShop = await fetchOwnerShop(user.id);
      setShop(userShop);
      
      if (!userShop?.id) {
        setError('No shop found for this owner');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shop data');
    } finally {
      // setIsLoading(false); // removed unused isLoading
    }
  };

  if (!user || (user.role !== 'owner')) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Owner role required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
  <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <Button asChild variant="ghost" size="sm" className="sm:hidden">
            <Link to={user.role === 'owner' ? '/owner' : '/dashboard'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Products Management</h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage products and inventory for {shop?.name || 'your shop'}
          </p>
          <Button 
            onClick={() => setShowAddProduct(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Products Management Component */}
      {shop?.id ? (
        <ProductsManagement shopId={shop.id} onRefresh={fetchShopData} />
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

      {/* Add Product Dialog */}
      <AddProductDialog 
        open={showAddProduct} 
        onOpenChange={setShowAddProduct}
        onSuccess={fetchShopData}
      />
    </div>
  );
}
