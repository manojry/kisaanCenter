import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Trash2, RefreshCw, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  record_status: 'active' | 'inactive';
}

interface Category {
  id: number;
  name: string;
  status: 'active' | 'inactive';
}

interface Shop {
  id: number;
  name: string;
  owner_id: number;
}

interface ShopProduct {
  id: number;
  shop_id: number;
  product_id: number;
  product_name: string;
  category_name: string;
  is_active: boolean;
}

const ShopProducts: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  // Cache products by category id
  const productsCache = useRef<{ [categoryId: number]: Product[] }>({});
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [selectedShop, setSelectedShop] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [filters, setFilters] = useState({ search: '' });

  // Only fetch shops and categories once per session
  const hasFetchedShops = useRef(false);
  const hasFetchedCategories = useRef(false);
  useEffect(() => {
    if (!hasFetchedShops.current) {
      fetchShops();
      hasFetchedShops.current = true;
    }
    if (!hasFetchedCategories.current) {
      fetchCategories();
      hasFetchedCategories.current = true;
    }
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetchShopProducts();
    }
  }, [selectedShop]);

  // Only fetch products for a category once per session, use cache if available
  useEffect(() => {
    if (selectedCategory) {
      if (productsCache.current[selectedCategory]) {
        setProducts(productsCache.current[selectedCategory]);
      } else {
        fetchProducts().then((fetched) => {
          if (fetched) {
            productsCache.current[selectedCategory] = fetched;
            setProducts(fetched);
          }
        });
      }
    } else {
      setProducts([]);
    }
  }, [selectedCategory]);

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setShops(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
  setCategories(data.data?.filter((c: Category) => c.status === 'active') || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // fetchProducts returns the products array for caching
  const fetchProducts = async (): Promise<Product[] | undefined> => {
    try {
      const response = await fetch(`/api/products?category_id=${selectedCategory}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        return data.data?.filter((p: Product) => p.record_status === 'active') || [];
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    return undefined;
  };

  const fetchShopProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shops/${selectedShop}/products`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend products to ShopProduct shape for table display
        setShopProducts(
          (data.products || []).map((p: any) => ({
            id: p.id,
            shop_id: selectedShop,
            product_id: p.id,
            product_name: p.name,
            category_name: (categories.find(c => c.id === p.category_id)?.name) || '',
            is_active: p.record_status === 'active',
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignProducts = async () => {
    if (!selectedShop || selectedProducts.length === 0) return;

    try {
      const promises = selectedProducts.map(productId =>
        fetch(`/api/shops/${selectedShop}/products/${productId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      );

      await Promise.all(promises);
      fetchShopProducts();
      setShowAssignForm(false);
      setSelectedProducts([]);
      setSelectedCategory(0);
      setProducts([]);
    } catch (error) {
      console.error('Error assigning products:', error);
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to remove this product from the shop?')) return;

    try {
      const response = await fetch(`/api/shops/${selectedShop}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchShopProducts();
      }
    } catch (error) {
      console.error('Error removing product:', error);
    }
  };

  const handleToggleProductStatus = async (productId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/shops/${selectedShop}/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: !isActive })
      });
      if (response.ok) {
        fetchShopProducts();
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const filteredShopProducts = shopProducts.filter(sp =>
    filters.search === '' || 
    sp.product_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    sp.category_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Products Assignment</h1>
          <p className="text-gray-600">Assign categories and products to shops</p>
        </div>
      </div>

      {/* Shop Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedShop ? selectedShop.toString() : ""} onValueChange={(value) => setSelectedShop(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a shop to manage products" />
            </SelectTrigger>
            <SelectContent>
              {shops.map(shop => (
                <SelectItem key={shop.id} value={shop.id.toString()}>
                  {shop.name} (Owner: #{shop.owner_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedShop > 0 && (
        <>
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-80"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchShopProducts} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Products
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Assign Products to Shop</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Category</Label>
                      <Select value={selectedCategory ? selectedCategory.toString() : ""} onValueChange={(value) => setSelectedCategory(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {products.length > 0 && (
                      <div>
                        <Label>Select Products</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                          {products.map(product => (
                            <div key={product.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`product-${product.id}`}
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={(checked: boolean) => {
                                  if (checked) {
                                    setSelectedProducts(prev => [...prev, product.id]);
                                  } else {
                                    setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`product-${product.id}`} className="flex-1">
                                {product.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAssignProducts} 
                        disabled={selectedProducts.length === 0}
                        className="flex-1"
                      >
                        Assign Selected Products
                      </Button>
                      <Button variant="outline" onClick={() => setShowAssignForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Shop Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shop Products ({filteredShopProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredShopProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No products assigned to this shop</p>
                  <p className="text-gray-400">Use the "Assign Products" button to add products</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShopProducts.map((shopProduct) => (
                      <TableRow key={shopProduct.id}>
                        <TableCell className="font-medium">{shopProduct.product_name}</TableCell>
                        <TableCell>{shopProduct.category_name}</TableCell>
                        <TableCell>
                          <Badge 
                            className={shopProduct.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            onClick={() => handleToggleProductStatus(shopProduct.product_id, shopProduct.is_active)}
                            style={{ cursor: 'pointer' }}
                          >
                            {shopProduct.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleToggleProductStatus(shopProduct.product_id, shopProduct.is_active)}
                            >
                              {shopProduct.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleRemoveProduct(shopProduct.product_id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ShopProducts;