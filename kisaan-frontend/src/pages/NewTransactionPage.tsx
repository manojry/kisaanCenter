import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { fetchOwnerShop } from '../utils/shopUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Calculator, CheckCircle } from 'lucide-react';

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { farmers, buyers, products, isLoading: dataLoading, error: dataError } = useTransactionFormData();
  const [shop, setShop] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    fetchShopData();
  }, [user]);

  useEffect(() => {
    calculateAmounts();
  }, [formData.quantity, formData.price, formData.buyer_paid]);

  const fetchShopData = async () => {
    if (!user?.id) return;
    try {
      const userShop = await fetchOwnerShop(user.id);
      setShop(userShop);
    } catch (err: any) {
      setError('Failed to load shop data');
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
      price: ''
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
    if (!shop?.id) {
      setError('Shop not found');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        shop_id: shop.id,
        farmer_id: parseInt(formData.farmer_id),
        buyer_id: parseInt(formData.buyer_id),
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        buyer_paid: parseFloat(formData.buyer_paid || '0'),
        farmer_paid: parseFloat(formData.farmer_paid || '0')
      };

      await apiClient.post('/transactions', payload);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
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

        {(error || dataError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error || dataError}</AlertDescription>
          </Alert>
        )}

        {dataLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading form data...</span>
          </div>
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
                              {product.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No products available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity and Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
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
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={isSubmitting || dataLoading}>
                      {isSubmitting ? 'Creating...' : 'Create Transaction'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Calculations Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calculations.total > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Sale:</span>
                      <span className="font-semibold">₹{calculations.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission (10%):</span>
                      <span className="font-semibold text-green-600">₹{calculations.commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Farmer Due:</span>
                      <span className="font-semibold text-blue-600">₹{calculations.farmer_due.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Enter quantity and price to see calculations</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}