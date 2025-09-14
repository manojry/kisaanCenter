
import { useState, useEffect } from 'react';
import { useShopProductsCache } from '../hooks/useShopProductsCache';
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
  // Use global shop products cache
  const { getShopProducts, setShopProducts, invalidateShopProducts } = useShopProductsCache();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  // Cache for available products by shopId
  // Global cache for available products by shopId (per session)
  const availableProductsCache: { [shopId: number]: Product[] } = {};
  const [shopCategories, setShopCategories] = useState<Category[]>([]);
  // Cache for shop categories by shopId
  // Global cache for shop categories by shopId (per session)
  const shopCategoriesCache: { [shopId: number]: Category[] } = {};
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
      const cached = getShopProducts(shopId);
      if (cached) {
        setProducts(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        fetchShopProducts(shopId);
      }
      if (shopCategoriesCache[shopId]) {
        setShopCategories(shopCategoriesCache[shopId]);
      } else {
        fetchShopCategories(shopId);
      }
    }
  }, [shopId]);

  useEffect(() => {
    if (shopId) {
      if (availableProductsCache[shopId]) {
        setAllProducts(availableProductsCache[shopId]);
      } else {
        fetchAvailableProducts(shopId);
      }
    }
  }, [shopId, products]);

  // Fetch products assigned to this shop
  const fetchShopProducts = async (shopId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching shop products for shopId:', shopId);
      const response = await apiClient.get(`/shops/${shopId}/products`) as any;
      console.log('📦 Shop products response:', response);
      const productsData = (response && (response.products || response.data)) || [];
      setShopProducts(shopId, Array.isArray(productsData) ? productsData : []);
      setProducts(getShopProducts(shopId));
      console.log('✅ Shop products loaded:', productsData.length);
    } catch (err) {
      const error = err as any;
      console.error('❌ Error fetching shop products:', error);
      setError(error?.message || 'Failed to load shop products');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available products for this shop (filtered by shop categories)
  const fetchAvailableProducts = async (shopId: number) => {
    try {
      console.log('🔍 Fetching available products for shopId:', shopId);
      const response = await apiClient.get(`/shops/${shopId}/available-products`) as any;
      console.log('📦 Available products response:', response);
      const available = (response && (response.products || response.data)) || [];
      const message = response && response.message;
  availableProductsCache[shopId] = Array.isArray(available) ? available : [];
  setAllProducts(availableProductsCache[shopId]);
      console.log('✅ Available products loaded:', available.length);
      if (message) {
        console.log('ℹ️ Backend message:', message);
      }
    } catch (err) {
      const error = err as any;
      console.error('❌ Failed to fetch available products:', error);
      // Fallback to all products if shop-specific endpoint fails
      try {
        console.log('🔄 Trying fallback to all products...');
        const fallbackResponse = await apiClient.get('/products') as any;
        console.log('📦 Fallback products response:', fallbackResponse);
        const allProds = (fallbackResponse && (fallbackResponse.data || fallbackResponse.products)) || [];
        // Filter out already assigned products
        const assignedIds = products.map(p => p.id);
        const filtered = Array.isArray(allProds) ? allProds.filter((p: Product) => 
          !assignedIds.includes(p.id) && p.record_status === 'active'
        ) : [];
  availableProductsCache[shopId] = filtered;
  setAllProducts(filtered);
        console.log('✅ Fallback products loaded:', filtered.length);
      } catch (fallbackErr) {
        const error2 = fallbackErr as any;
        console.error('❌ Failed to fetch fallback products:', error2);
        setAllProducts([]);
      }
    }
  };

  // Fetch shop categories
  const fetchShopCategories = async (shopId: number) => {
    try {
      console.log('🔍 Fetching shop categories for shopId:', shopId);
  const response = await apiClient.get(`/shops/${shopId}/categories`) as any;
  console.log('📂 Shop categories response:', response);
  const categories = (response && (response.categories || response.data)) || [];
  const cats = Array.isArray(categories) ? categories : [];
  shopCategoriesCache[shopId] = cats;
  setShopCategories(cats);
  console.log('✅ Shop categories loaded:', cats.length);
    } catch (err) {
      const error = err as any;
      console.error('❌ Failed to fetch shop categories:', error);
      setShopCategories([]);
    }
  };

  const handleProductAdded = () => {
    if (shopId) {
      // Invalidate cache for this shop
      invalidateShopProducts(shopId);
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
      // Invalidate cache for this shop
      invalidateShopProducts(shopId);
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
      // Invalidate cache for this shop
      invalidateShopProducts(shopId);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-5 w-5 text-green-600" />
                My Shop Products - Currently Assigned
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Products currently assigned to your shop for selling. ({products.length} assigned)
                {shopCategories.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Shop Categories: </span>
                    <span className="text-sm">{shopCategories.map(c => c.name).join(', ')}</span>
                  </div>
                )}
                <span className="block sm:hidden mt-2 text-xs text-muted-foreground">Add new products using the button below.</span>
              </CardDescription>
            </div>
            <div className="w-full sm:w-auto flex justify-end">
              <Button 
                onClick={() => setShowAddProduct(true)} 
                variant="outline" 
                className="w-full sm:w-auto px-2 sm:px-4 text-xs sm:text-sm h-10 sm:h-9"
                title="Add New Product to Central Catalog"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add New Product</span>

              </Button>
            </div>
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
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
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
              {/* Mobile Card/List Layout */}
              <div className="block sm:hidden space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="rounded-lg border p-3 bg-white shadow-sm w-full max-w-full overflow-x-hidden mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-base break-words break-all w-2/3">{product.name || 'N/A'}</span>
                      <Badge variant="outline" className="w-fit">{product.category_name || '-'}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mb-2">
                      <div className="break-words break-all"><span className="font-medium">Price:</span> {formatCurrency(product.price)}</div>
                      <div className="break-words break-all"><span className="font-medium">Unit:</span> {product.unit || '-'}</div>
                      <div className="break-words break-all col-span-2"><span className="font-medium">Assigned:</span> {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}</div>
                    </div>
                    <div className="text-xs break-words break-all mb-2"><span className="font-medium">Description:</span> {product.description || '-'}</div>
                    <div className="flex justify-end">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => handleRemoveProduct(product.id)} 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
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
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
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
              {/* Mobile Card/List Layout */}
              <div className="block sm:hidden space-y-3">
                {allProducts.map((product) => (
                  <div key={product.id} className="rounded-lg border p-3 bg-white shadow-sm w-full max-w-full overflow-x-hidden mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-base break-words break-all w-2/3">{product.name || 'N/A'}</span>
                      <Badge variant="secondary" className="w-fit">{product.category_name || '-'}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mb-2">
                      <div className="break-words break-all"><span className="font-medium">Price:</span> {formatCurrency(product.price)}</div>
                      <div className="break-words break-all"><span className="font-medium">Unit:</span> {product.unit || '-'}</div>
                    </div>
                    <div className="text-xs break-words break-all mb-2"><span className="font-medium">Description:</span> {product.description || '-'}</div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleAssignProduct(product.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Assign to Shop
                      </Button>
                    </div>
                  </div>
                ))}
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