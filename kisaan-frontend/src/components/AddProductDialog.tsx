import React, { useState, useEffect } from 'react';
import { useCategoriesCache } from '../hooks/useCategoriesCache';
import { apiClient } from '../services/apiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shopId?: number;
}

interface Category {
  id: number;
  name: string;
}

export default function AddProductDialog({ open, onOpenChange, onSuccess, shopId }: AddProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    unit: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getCategories, setCategoriesCache } = useCategoriesCache();

  useEffect(() => {
    if (open) {
      const cached = getCategories();
      if (cached) {
        setCategories(cached);
      } else {
        fetchCategories();
      }
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      const categoriesData = Array.isArray(response) ? response : response?.data || [];
      setCategoriesCache(categoriesData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError('Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category_id) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        unit: formData.unit || null,
        shop_id: shopId
      };

      await apiClient.post('/products', productData);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category_id: '',
        price: '',
        unit: ''
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your shop's category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Category *</Label>
            <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                placeholder="kg, piece, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Product description (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}