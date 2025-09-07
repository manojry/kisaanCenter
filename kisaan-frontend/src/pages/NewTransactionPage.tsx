import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Calculator, CheckCircle } from 'lucide-react';

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

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [farmers, setFarmers] = useState<User[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    farmer_id: '',
    buyer_id: '',
    product_id: '',
    quantity: '',
    price: '',
    buyer_paid: '',
    farmer_paid: '',
    is_full_payment: false
  });

  const [calculations, setCalculations] = useState({
    total: 0,
    commission: 0,
    farmer_due: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateAmounts();
  }, [formData.quantity, formData.price, formData.buyer_paid]);

  const fetchData = async () => {
    try {
      // Get shop first
      const shopRes = await apiClient.get(`/shops?owner_id=${user.id}`);
      const shops = shopRes?.shops || [];
      const userShop = shops[0];
      setShop(userShop);
      
      const [usersRes, productsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get(`/products?shop_id=${userShop?.id}`)
      ]);

      const users = usersRes?.users || [];
      setFarmers(users.filter((u: User) => u.role === 'farmer'));
      setBuyers(users.filter((u: User) => u.role === 'buyer'));
      
      const products = productsRes?.data || productsRes?.products || [];
      console.log('Products loaded:', products);
      setProducts(products);
    } catch (err: any) {
      setError('Failed to load data');
    }
  };

  const calculateAmounts = () => {
    const quantity = parseFloat(formData.quantity || '0');
    const price = parseFloat(formData.price || '0');
    const buyerPaid = parseFloat(formData.buyer_paid || '0');
    
    const total = quantity * price;
    const commission = total * 0.1; // 10% commission
    const farmerDue = total - commission;
    
    setCalculations({ total, commission, farmer_due: farmerDue });
    
    // Auto-fill farmer paid if full payment is selected
    if (formData.is_full_payment && buyerPaid >= total) {
      setFormData(prev => ({ ...prev, farmer_paid: farmerDue.toString() }));
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === parseInt(productId));
    setFormData(prev => ({ 
      ...prev, 
      product_id: productId,
      price: product?.price?.toString() || ''
    }));
  };

  const handleFullPayment = () => {
    setFormData(prev => ({
      ...prev,
      is_full_payment: !prev.is_full_payment,
      buyer_paid: !prev.is_full_payment ? calculations.total.toString() : '',
      farmer_paid: !prev.is_full_payment ? calculations.farmer_due.toString() : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const total = parseInt(formData.quantity) * parseFloat(formData.price);
      

      const payload = {
        shop_id: shop?.id || 1,
        farmer_id: formData.farmer_id,
        seller_id: formData.farmer_id, // Bind seller_id to farmer_id for backend compatibility
        buyer_id: formData.buyer_id,
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        total: total,
        buyer_paid: parseFloat(formData.buyer_paid || '0'),
        farmer_paid: parseFloat(formData.farmer_paid || '0'),
        transaction_date: new Date().toISOString()
      };

      await apiClient.post('/transactions', payload);
      setSuccess(true);
      
      // Reset form after 2 seconds or navigate back
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      farmer_id: '',
      buyer_id: '',
      product_id: '',
      quantity: '',
      price: '',
      buyer_paid: '',
      farmer_paid: '',
      is_full_payment: false
    });
    setCalculations({ total: 0, commission: 0, farmer_due: 0 });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Transaction Recorded!</h2>
            <p className="text-gray-600 mb-4">Sale has been successfully recorded.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Record New Sale</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Farmer & Buyer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="farmer_id">Farmer *</Label>
                      <Select value={formData.farmer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, farmer_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select farmer" />
                        </SelectTrigger>
                        <SelectContent>
                          {farmers.map(farmer => (
                            <SelectItem key={farmer.id} value={farmer.id.toString()}>{farmer.username}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="buyer_id">Buyer *</Label>
                      <Select value={formData.buyer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, buyer_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select buyer" />
                        </SelectTrigger>
                        <SelectContent>
                          {buyers.map(buyer => (
                            <SelectItem key={buyer.id} value={buyer.id.toString()}>{buyer.username}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div>
                    <Label htmlFor="product_id">Product *</Label>
                    <Select value={formData.product_id} onValueChange={handleProductSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder={products.length > 0 ? "Select product" : "No products available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length > 0 ? (
                          products.map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ₹{product.price || 0}/unit
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-products" disabled>
                            No products found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {products.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        No products available. Please add products first.
                      </p>
                    )}
                  </div>

                  {/* Quantity & Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="Enter quantity"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price per unit *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Enter price"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="full_payment"
                        checked={formData.is_full_payment}
                        onChange={handleFullPayment}
                        className="rounded"
                      />
                      <Label htmlFor="full_payment">Full Payment (Auto-fill amounts)</Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="buyer_paid">Buyer Paid</Label>
                        <Input
                          id="buyer_paid"
                          type="number"
                          step="0.01"
                          value={formData.buyer_paid}
                          onChange={(e) => setFormData(prev => ({ ...prev, buyer_paid: e.target.value }))}
                          placeholder="Amount paid by buyer"
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
                          placeholder="Amount paid to farmer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Recording...' : 'Record Sale'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{formData.quantity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price/unit:</span>
                    <span>₹{formData.price || 0}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>₹{calculations.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Commission (10%):</span>
                    <span>₹{calculations.commission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Farmer Due:</span>
                    <span>₹{calculations.farmer_due.toFixed(2)}</span>
                  </div>
                </div>

                {calculations.total > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Quick tip: Check "Full Payment" to auto-fill payment amounts for immediate settlement.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}