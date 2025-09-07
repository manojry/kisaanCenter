import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Plus, AlertCircle, Package } from 'lucide-react';
import AddProductDialog from './AddProductDialog';

interface Product {
  id: number;
  name: string;
  category_id: number;
  price: number;
  unit: string;
  description?: string;
  created_at: string;
}

interface ProductsManagementProps {
  shopId?: number;
  onRefresh?: () => void;
}

export default function ProductsManagement({ shopId, onRefresh }: ProductsManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/products';
      if (shopId) {
        url += `?shop_id=${shopId}`;
      }
      
      const response = await apiClient.get(url);
      const productsData = response?.products || response?.data || response || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductAdded = () => {
    fetchProducts();
    if (onRefresh) onRefresh();
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount || isNaN(Number(amount))) return '₹0.00';
    return `₹${Number(amount).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading products...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products Management
              </CardTitle>
              <CardDescription>
                Manage products in your shop category ({products.length} products)
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddProduct(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found. Add products to your shop category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.unit || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {product.description || '-'}
                      </TableCell>
                      <TableCell>
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddProductDialog 
        open={showAddProduct} 
        onOpenChange={setShowAddProduct}
        onSuccess={handleProductAdded}
        shopId={shopId}
      />
    </>
  );
}