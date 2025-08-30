import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { productManagementApi } from '../api/productManagementApi';

interface Product {
  id: number;
  name: string;
  category_name: string;
  unit: string;
  description?: string;
}

interface ProductsByCategory {
  [category: string]: Product[];
}

interface ShopProduct {
  shop_product_id: number;
  product_id: number;
  name: string;
  unit: string;
  default_price?: number;
}

interface ProductAssignmentWizardProps {
  shopId: number;
  farmerId?: number;
  mode: 'shop-setup' | 'farmer-assignment';
  onComplete: () => void;
  onCancel: () => void;
}

export const ProductAssignmentWizard: React.FC<ProductAssignmentWizardProps> = ({
  shopId,
  farmerId,
  mode,
  onComplete,
  onCancel
}) => {
  const [step, setStep] = useState(1);
  const [allProducts, setAllProducts] = useState<ProductsByCategory>({});
  const [shopProducts, setShopProducts] = useState<ProductsByCategory>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [farmerAssignments, setFarmerAssignments] = useState<Map<number, any>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [mode, shopId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'shop-setup') {
        const response = await productManagementApi.getAllProducts();
        setAllProducts(response.data.products_by_category);
      } else {
        const response = await productManagementApi.getShopCatalog(shopId);
        setShopProducts(response.data.products_by_category);
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelection = (productId: number, selected: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (selected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleFarmerAssignment = (shopProductId: number, assignment: any) => {
    const newAssignments = new Map(farmerAssignments);
    if (assignment.selected) {
      newAssignments.set(shopProductId, {
        shop_product_id: shopProductId,
        preferred_price: assignment.preferred_price ? parseFloat(assignment.preferred_price) : null,
        notes: assignment.notes
      });
    } else {
      newAssignments.delete(shopProductId);
    }
    setFarmerAssignments(newAssignments);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (mode === 'shop-setup') {
        await productManagementApi.setupShopProducts(shopId, {
          selected_product_ids: Array.from(selectedProducts)
        });
        setSuccess(`Successfully configured ${selectedProducts.size} products for your shop!`);
      } else {
        await productManagementApi.assignFarmerProducts(farmerId!, {
          product_assignments: Array.from(farmerAssignments.values())
        });
        setSuccess(`Successfully assigned ${farmerAssignments.size} products to farmer!`);
      }
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save assignments');
    } finally {
      setLoading(false);
    }
  };

  const renderShopSetup = () => {
    const categories = Object.keys(allProducts);
    if (categories.length === 0) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Select Products for Your Shop</h2>
          <p className="text-gray-600 mt-2">
            Choose which products you want to sell in your shop. You can modify this later.
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {selectedProducts.size} products selected
            </Badge>
          </div>
        </div>

        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
                <Badge variant="secondary" className="ml-2">
                  {allProducts[category]?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(allProducts).map(([category, products]) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold capitalize">{category}</h3>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const categoryProductIds = products.map(p => p.id);
                      const newSelected = new Set(selectedProducts);
                      categoryProductIds.forEach(id => newSelected.add(id));
                      setSelectedProducts(newSelected);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const categoryProductIds = products.map(p => p.id);
                      const newSelected = new Set(selectedProducts);
                      categoryProductIds.forEach(id => newSelected.delete(id));
                      setSelectedProducts(newSelected);
                    }}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <Card 
                    key={product.id} 
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      selectedProducts.has(product.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleProductSelection(product.id, !selectedProducts.has(product.id))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id={`product-${product.id}`}
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={(checked) => handleProductSelection(product.id, !!checked)}
                            />
                            <Label htmlFor={`product-${product.id}`} className="font-medium cursor-pointer">
                              {product.name}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Unit: {product.unit}</p>
                          {product.description && (
                            <p className="text-xs text-gray-500">{product.description}</p>
                          )}
                        </div>
                        {selectedProducts.has(product.id) && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-600">
            Selected: {selectedProducts.size} products
          </div>
          <div className="space-x-3">
            <Button 
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={selectedProducts.size === 0 || loading}
              className="px-8"
            >
              {loading ? 'Setting up...' : 'Setup Shop Products'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderFarmerAssignment = () => {
    const categories = Object.keys(shopProducts);
    if (categories.length === 0) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Assign Products to Farmer</h2>
          <p className="text-gray-600 mt-2">
            Select which products you want to assign to this farmer and set preferred prices.
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {farmerAssignments.size} products assigned
            </Badge>
          </div>
        </div>

        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
                <Badge variant="secondary" className="ml-2">
                  {shopProducts[category]?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(shopProducts).map(([category, products]) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold capitalize">{category}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(product => (
                  <Card 
                    key={product.shop_product_id} 
                    className={`hover:shadow-md transition-shadow ${
                      farmerAssignments.has(product.shop_product_id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`shop-product-${product.shop_product_id}`}
                            checked={farmerAssignments.has(product.shop_product_id)}
                            onCheckedChange={(checked) => handleFarmerAssignment(product.shop_product_id, {
                              selected: !!checked,
                              preferred_price: farmerAssignments.get(product.shop_product_id)?.preferred_price || '',
                              notes: farmerAssignments.get(product.shop_product_id)?.notes || ''
                            })}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`shop-product-${product.shop_product_id}`} className="font-medium cursor-pointer">
                              {product.name}
                            </Label>
                            <p className="text-sm text-gray-600">
                              Unit: {product.unit}
                              {product.default_price && (
                                <span className="ml-2">
                                  • Default Price: ₹{product.default_price}/{product.unit}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {farmerAssignments.has(product.shop_product_id) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t">
                            <div>
                              <Label htmlFor={`price-${product.shop_product_id}`} className="text-sm">
                                Preferred Price (₹/{product.unit})
                              </Label>
                              <Input
                                id={`price-${product.shop_product_id}`}
                                type="number"
                                step="0.01"
                                placeholder="Enter price"
                                value={farmerAssignments.get(product.shop_product_id)?.preferred_price || ''}
                                onChange={(e) => handleFarmerAssignment(product.shop_product_id, {
                                  selected: true,
                                  preferred_price: e.target.value,
                                  notes: farmerAssignments.get(product.shop_product_id)?.notes || ''
                                })}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`notes-${product.shop_product_id}`} className="text-sm">
                                Notes (Optional)
                              </Label>
                              <Input
                                id={`notes-${product.shop_product_id}`}
                                placeholder="Quality grade, special instructions..."
                                value={farmerAssignments.get(product.shop_product_id)?.notes || ''}
                                onChange={(e) => handleFarmerAssignment(product.shop_product_id, {
                                  selected: true,
                                  preferred_price: farmerAssignments.get(product.shop_product_id)?.preferred_price || '',
                                  notes: e.target.value
                                })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-600">
            Assigned: {farmerAssignments.size} products
          </div>
          <div className="space-x-3">
            <Button 
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={farmerAssignments.size === 0 || loading}
              className="px-8"
            >
              {loading ? 'Assigning...' : 'Assign Products'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {mode === 'shop-setup' ? renderShopSetup() : renderFarmerAssignment()}
    </div>
  );
};

// Farmer Product Assignment Card Component
interface FarmerProductAssignmentCardProps {
  product: ShopProduct;
  assignment?: any;
  onAssignmentChange: (assignment: any) => void;
}

const FarmerProductAssignmentCard: React.FC<FarmerProductAssignmentCardProps> = ({
  product,
  assignment,
  onAssignmentChange
}) => {
  const [isSelected, setIsSelected] = useState(!!assignment);
  const [preferredPrice, setPreferredPrice] = useState(assignment?.preferred_price || '');
  const [notes, setNotes] = useState(assignment?.notes || '');

  const handleSelectionChange = (selected: boolean) => {
    setIsSelected(selected);
    onAssignmentChange({
      selected,
      preferred_price: selected ? parseFloat(preferredPrice) || null : null,
      notes: selected ? notes : ''
    });
  };

  const handlePriceChange = (value: string) => {
    setPreferredPrice(value);
    if (isSelected) {
      onAssignmentChange({
        selected: true,
        preferred_price: parseFloat(value) || null,
        notes
      });
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (isSelected) {
      onAssignmentChange({
        selected: true,
        preferred_price: parseFloat(preferredPrice) || null,
        notes: value
      });
    }
  };

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Checkbox
            id={`farmer-product-${product.shop_product_id}`}
            checked={isSelected}
            onCheckedChange={handleSelectionChange}
          />
          
          <div className="flex-1 space-y-3">
            <div>
              <Label 
                htmlFor={`farmer-product-${product.shop_product_id}`}
                className="font-medium cursor-pointer"
              >
                {product.name}
              </Label>
              <p className="text-sm text-gray-500">
                Unit: {product.unit}
                {product.default_price && (
                  <span className="ml-2">
                    • Default Price: ₹{product.default_price}/{product.unit}
                  </span>
                )}
              </p>
            </div>

            {isSelected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`price-${product.shop_product_id}`} className="text-sm">
                    Preferred Price (₹/{product.unit})
                  </Label>
                  <Input
                    id={`price-${product.shop_product_id}`}
                    type="number"
                    step="0.01"
                    placeholder="Enter price"
                    value={preferredPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`notes-${product.shop_product_id}`} className="text-sm">
                    Notes (Optional)
                  </Label>
                  <Input
                    id={`notes-${product.shop_product_id}`}
                    placeholder="Quality grade, special instructions..."
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};