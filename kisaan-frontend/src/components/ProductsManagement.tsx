
import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Plus, AlertCircle, Package, Trash2 } from 'lucide-react';
import AddProductDialog from './AddProductDialog';

interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  price?: number;
  unit?: string;
  description?: string;
  created_at: string;
  record_status?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface ProductsManagementProps {
  shopId?: number;
  onRefresh?: () => void;
}

export default function ProductsManagement({ shopId, onRefresh }: ProductsManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [shopCategories, setShopCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  console.log('📝 ProductsManagement received shopId:', shopId);

  if (!shopId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <p className="text-lg font-medium">No Shop Found</p>
            <p className="text-muted-foreground">Please contact support to set up your shop.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    if (shopId) {
      fetchShopProducts(shopId);
      fetchShopCategories(shopId);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopId) {
      fetchAvailableProducts(shopId);
    }
  }, [shopId, products]); // Re-fetch when products change

  // Fetch products assigned to this shop
  const fetchShopProducts = async (shopId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching shop products for shopId:', shopId);
      const response = await apiClient.get(`/shops/${shopId}/products`);
      console.log('📦 Shop products response:', response);
      const productsData = response?.products || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
      console.log('✅ Shop products loaded:', productsData.length);
    } catch (err: any) {
      console.error('❌ Error fetching shop products:', err);
      setError(err.message || 'Failed to load shop products');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available products for this shop (filtered by shop categories)
  const fetchAvailableProducts = async (shopId: number) => {
    try {
      console.log('🔍 Fetching available products for shopId:', shopId);
      const response = await apiClient.get(`/shops/${shopId}/available-products`);
      console.log('📦 Available products response:', response);
      const available = response?.products || [];
      const message = response?.message || '';
      setAllProducts(Array.isArray(available) ? available : []);
      console.log('✅ Available products loaded:', available.length);
      if (message) {
        console.log('ℹ️ Backend message:', message);
      }
    } catch (err) {
      console.error('❌ Failed to fetch available products:', err);
      // Fallback to all products if shop-specific endpoint fails
      try {
        console.log('🔄 Trying fallback to all products...');
        const fallbackResponse = await apiClient.get('/products');
        console.log('📦 Fallback products response:', fallbackResponse);
        const allProds = fallbackResponse?.data || fallbackResponse?.products || [];
        // Filter out already assigned products
        const assignedIds = products.map(p => p.id);
        const filtered = Array.isArray(allProds) ? allProds.filter((p: Product) => 
          !assignedIds.includes(p.id) && p.record_status === 'active'
        ) : [];
        setAllProducts(filtered);
        console.log('✅ Fallback products loaded:', filtered.length);
      } catch (fallbackErr) {
        console.error('❌ Failed to fetch fallback products:', fallbackErr);
        setAllProducts([]);
      }
    }
  };

  // Fetch shop categories
  const fetchShopCategories = async (shopId: number) => {
    try {
      console.log('🔍 Fetching shop categories for shopId:', shopId);
      const response = await apiClient.get(`/shops/${shopId}/categories`);
      console.log('📂 Shop categories response:', response);
      const categories = response?.categories || [];
      setShopCategories(Array.isArray(categories) ? categories : []);
      console.log('✅ Shop categories loaded:', categories.length);
    } catch (err) {
      console.error('❌ Failed to fetch shop categories:', err);
      setShopCategories([]);
    }
  };

  const handleProductAdded = () => {
    if (shopId) {
      fetchShopProducts(shopId);
      fetchAvailableProducts(shopId);
    }
    if (onRefresh) onRefresh();
  };

  // Assign a product to this shop
  const handleAssignProduct = async (productId: number) => {
    if (!shopId) return;
    try {
      console.log('🔄 Assigning product', productId, 'to shop', shopId);
      const response = await apiClient.post(`/shops/${shopId}/products/${productId}`);
      console.log('✅ Product assigned successfully:', response);
      await Promise.all([
        fetchShopProducts(shopId),
        fetchAvailableProducts(shopId)
      ]);
    } catch (err: any) {
      console.error('❌ Failed to assign product:', err);
      setError(err.message || 'Failed to assign product');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Remove a product from this shop
  const handleRemoveProduct = async (productId: number) => {
    if (!shopId) return;
    try {
      await apiClient.delete(`/shops/${shopId}/products/${productId}`);
      await Promise.all([
        fetchShopProducts(shopId),
        fetchAvailableProducts(shopId)
      ]);
    } catch (err: any) {
      console.error('Failed to remove product:', err);
      setError(err.message || 'Failed to remove product');
      setTimeout(() => setError(null), 3000);
    }
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
                <Package className="h-5 w-5 text-green-600" />
                My Shop Products - Currently Assigned
              </CardTitle>
              <CardDescription>
                Products currently assigned to your shop for selling. ({products.length} assigned)
                {shopCategories.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Shop Categories: </span>
                    <span className="text-sm">{shopCategories.map(c => c.name).join(', ')}</span>
                  </div>
                )}
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddProduct(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add New Product to Central Catalog
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No products assigned to your shop yet</p>
              <p className="text-sm mt-2">Assign products from the central catalog below to start selling.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Your Shop's Product Inventory</span>
                </div>
                <p className="text-sm text-green-700">
                  These products are assigned to your shop and available for transactions. 
                  You can remove products you no longer want to sell.
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="hover:bg-green-50">
                        <TableCell className="font-medium">{product.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category_name || '-'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                        <TableCell>{product.unit || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{product.description || '-'}</TableCell>
                        <TableCell>{product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRemoveProduct(product.id)} 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> 
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Central Products Available for Assignment */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Central Products - Available for Assignment
          </CardTitle>
          <CardDescription>
            {shopCategories.length > 0 
              ? `Products from your shop categories: ${shopCategories.map(c => c.name).join(', ')} (${allProducts.length} available)`
              : `No categories assigned to your shop - showing all central products (${allProducts.length} available)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No central products available for assignment</p>
              <p className="text-sm mt-2">
                {shopCategories.length === 0 
                  ? 'No categories assigned to your shop. All central products are available for assignment.'
                  : 'All products from your categories are already assigned to your shop.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Central Product Catalog</span>
                </div>
                <p className="text-sm text-blue-700">
                  These are products from the central catalog that you can assign to your shop for selling. 
                  Once assigned, they will appear in your shop's product list for transactions.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  Debug: Shop ID: {shopId}, Assigned: {products.length}, Available: {allProducts.length}, Categories: {shopCategories.length}
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-blue-50">
                        <TableCell className="font-medium">{product.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category_name || '-'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                        <TableCell>{product.unit || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{product.description || '-'}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleAssignProduct(product.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Assign to Shop
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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