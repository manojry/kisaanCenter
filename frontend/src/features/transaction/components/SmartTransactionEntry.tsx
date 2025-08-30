
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { productManagementApi } from '../../product/api/productManagementApi';

interface FarmerProduct {
  farmer_product_id: number;
  product_id: number;
  shop_product_id: number;
  name: string;
  unit: string;
  preferred_price?: number;
  default_price?: number;
  notes?: string;
}

interface ProductsByCategory {
  [category: string]: FarmerProduct[];
}

interface SmartTransactionEntryProps {
  farmerId: number;
  onProductSelect: (product: FarmerProduct, quantity: number, price: number) => void;
}

export const SmartTransactionEntry: React.FC<SmartTransactionEntryProps> = ({
  farmerId,
  onProductSelect
}) => {
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<FarmerProduct | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFarmerProducts();
  }, [farmerId]);

  const loadFarmerProducts = async () => {
    setLoading(true);
    try {
      const response = await productManagementApi.getFarmerAvailableProducts(farmerId);
      const products = response.data.products_by_category;
      setProductsByCategory(products);
      
      // Auto-select first category if available
      const categories = Object.keys(products);
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    } catch (error) {
      console.error('Failed to load farmer products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedProduct(null);
    setQuantity('');
    setPrice('');
  };

  const handleProductChange = (productId: string) => {
    const product = productsByCategory[selectedCategory]?.find(
      p => p.farmer_product_id.toString() === productId
    );
    
    if (product) {
      setSelectedProduct(product);
      // Auto-fill price with preferred or default price
      const suggestedPrice = product.preferred_price || product.default_price;
      if (suggestedPrice) {
        setPrice(suggestedPrice.toString());
      }
    }
  };

  const handleAddProduct = () => {
    if (selectedProduct && quantity && price) {
      onProductSelect(selectedProduct, parseFloat(quantity), parseFloat(price));
      
      // Reset form
      setQuantity('');
      setPrice('');
      setSelectedProduct(null);
    }
  };

  const categories = Object.keys(productsByCategory);
  const availableProducts = selectedCategory ? productsByCategory[selectedCategory] || [] : [];

  if (loading) {
    return <div className="text-center py-8">Loading farmer products...</div>;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <h3 className="text-lg font-semibold">Add Product to Transaction</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select 
              value={selectedProduct?.farmer_product_id.toString() || ''} 
              onValueChange={handleProductChange}
              disabled={!selectedCategory}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder={selectedCategory ? "Select a product" : "Select category first"} />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map(product => (
                  <SelectItem 
                    key={product.farmer_product_id} 
                    value={product.farmer_product_id.toString()}
                  >
                    <div className="flex justify-between w-full">
                      <span>{product.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {product.unit}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="0"
              step="0.01"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price ({selectedProduct?.unit || 'unit'})</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Add Button */}
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleAddProduct}
            disabled={!selectedProduct || !quantity || !price}
          >
            Add to Transaction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
