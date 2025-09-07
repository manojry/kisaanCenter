import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shopId?: number;
}

interface User {
  id: string;
  username: string;
  role: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function CreateTransactionDialog({ open, onOpenChange, onSuccess, shopId }: CreateTransactionDialogProps) {
  const [farmers, setFarmers] = useState<User[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    farmer_id: '',
    buyer_id: '',
    product_id: '',
    quantity: '',
    price: '',
    buyer_paid: '',
    farmer_paid: ''
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [usersRes, productsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/products')
      ]);

      const users = usersRes?.users || [];
      setFarmers(users.filter((u: User) => u.role === 'farmer'));
      setBuyers(users.filter((u: User) => u.role === 'buyer'));
      setProducts(productsRes?.data || []);
    } catch (err: any) {
      setError('Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        shop_id: shopId,
        farmer_id: formData.farmer_id,
        buyer_id: formData.buyer_id,
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        buyer_paid: parseFloat(formData.buyer_paid || '0'),
        farmer_paid: parseFloat(formData.farmer_paid || '0')
      };

      await apiClient.post('/transactions', payload);
      onSuccess();
      onOpenChange(false);
      setFormData({
        farmer_id: '',
        buyer_id: '',
        product_id: '',
        quantity: '',
        price: '',
        buyer_paid: '',
        farmer_paid: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
  const calculatedTotal = parseFloat(formData.quantity || '0') * parseFloat(formData.price || '0');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record New Sale</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="farmer_id">Farmer</Label>
            <Select value={formData.farmer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, farmer_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select farmer" />
              </SelectTrigger>
              <SelectContent>
                {farmers.map(farmer => (
                  <SelectItem key={farmer.id} value={farmer.id}>{farmer.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="buyer_id">Buyer</Label>
            <Select value={formData.buyer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, buyer_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select buyer" />
              </SelectTrigger>
              <SelectContent>
                {buyers.map(buyer => (
                  <SelectItem key={buyer.id} value={buyer.id}>{buyer.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product_id">Product</Label>
            <Select value={formData.product_id} onValueChange={(value) => {
              const product = products.find(p => p.id === parseInt(value));
              setFormData(prev => ({ 
                ...prev, 
                product_id: value,
                price: product?.price?.toString() || ''
              }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} - ₹{product.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price per unit</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
          </div>

          {calculatedTotal > 0 && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium">Total: ₹{calculatedTotal.toFixed(2)}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyer_paid">Buyer Paid</Label>
              <Input
                id="buyer_paid"
                type="number"
                step="0.01"
                value={formData.buyer_paid}
                onChange={(e) => setFormData(prev => ({ ...prev, buyer_paid: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="farmer_paid">Farmer Paid</Label>
              <Input
                id="farmer_paid"
                type="number"
                step="0.01"
                value={formData.farmer_paid}
                onChange={(e) => setFormData(prev => ({ ...prev, farmer_paid: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}