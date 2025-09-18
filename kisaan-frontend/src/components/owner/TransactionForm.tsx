import React, { useState, useEffect, useRef } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { useCategoriesCache } from '../../hooks/useCategoriesCache';
import { useShopProductsCache } from '../../hooks/useShopProductsCache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Select from 'react-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calculator, AlertCircle } from 'lucide-react';
import { usersApi, categoriesApi } from '../../services/api';
import { apiClient } from '../../services/apiClient';
import type { TransactionCreate, User, Category } from '../../types/api';
// Extend TransactionCreate for local form usage to include product_id
interface TransactionFormData extends TransactionCreate {
  product_id?: number;
}
import { useAuth } from '../../context/AuthContext';

interface Product {
  id: number;
  name: string;
}

interface TransactionFormProps {
  onSuccess?: (transaction: any) => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  // State for product dropdown visibility
  const { user } = useAuth();
  // Search states for dropdowns
  // Get users from zustand store
  const { getUsers, setUsers } = useTransactionStore();
  const [farmers, setFarmers] = useState<User[]>(getUsers(user?.shop_id?.toString() || ''));
  const [buyers, setBuyers] = useState<User[]>(getUsers(user?.shop_id?.toString() || ''));
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Use global shop products cache
  const { getShopProducts, setShopProducts } = useShopProductsCache();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<TransactionFormData>({
    shop_id: user?.shop_id || 0,
    farmer_id: 0,
    buyer_id: 0,
    category_id: 0,
    product_name: '',
    quantity: 0,
    unit_price: 0
  });
  const [calculations, setCalculations] = useState({
    total_sale_value: 0,
    shop_commission: 0,
    farmer_earning: 0
  });
  const [commissionRate, setCommissionRate] = useState<number>(0.1); // Default to 10%
  // Cache for commission rate by shopId
  const commissionRateCache = useRef<{ [shopId: number]: number }>({});
  // Payment fields
  const [buyerPaid, setBuyerPaid] = useState(0);
  const [farmerPaid, setFarmerPaid] = useState(0);
  const [commissionReceived, setCommissionReceived] = useState(0);
  // Payment method fields
  const [buyerPaymentMethod, setBuyerPaymentMethod] = useState<'CASH' | 'BANK' | 'UPI' | 'OTHER'>('CASH');
  const [farmerPaymentMethod, setFarmerPaymentMethod] = useState<'CASH' | 'BANK' | 'UPI' | 'OTHER'>('CASH');

  useEffect(() => {
    fetchData();
    if (user?.shop_id) {
      if (commissionRateCache.current[user.shop_id] !== undefined) {
        setCommissionRate(commissionRateCache.current[user.shop_id]);
      } else {
        fetchCommissionRate();
      }
    }
  }, []);

  useEffect(() => {
    calculateAmounts();
  }, [formData.quantity, formData.unit_price, commissionRate]);

  // Set default payment values when calculations change, rounded to 2 decimals
  useEffect(() => {
    setBuyerPaid(Number(calculations.total_sale_value.toFixed(2)));
    setFarmerPaid(Number(calculations.farmer_earning.toFixed(2)));
    setCommissionReceived(Number(calculations.shop_commission.toFixed(2)));
  }, [calculations.total_sale_value, calculations.farmer_earning, calculations.shop_commission]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let users = getUsers(user?.shop_id?.toString() || '');
      if (!users || users.length === 0) {
        const usersResponse = await usersApi.getAll({ limit: 100 });
        users = usersResponse.data || [];
        setUsers(user?.shop_id?.toString() || '', users);
      }
      setFarmers(users.filter(u => u.role === 'farmer'));
      setBuyers(users.filter(u => u.role === 'buyer'));

      // Categories: use global cache
      const { getCategories, setCategoriesCache } = useCategoriesCache();
      let cats = getCategories();
      if (!cats) {
        const categoriesResponse = await categoriesApi.getAll();
        cats = categoriesResponse.data || [];
        setCategoriesCache(cats);
      }
      setCategories(cats);

      // Only fetch products if shop_id is valid
      if (user?.shop_id) {
        const cached = getShopProducts(user.shop_id);
        if (cached) {
          setProducts(cached);
        } else {
          const productsResponseRaw = await apiClient.get(`/shops/${user.shop_id}/products`);
          const productsResponse = productsResponseRaw as any;
          const prods = productsResponse.products || [];
          setShopProducts(user.shop_id, prods);
          setProducts(prods);
        }
      } else {
        setProducts([]);
      }

      // Set default category to first shop category
      if (cats.length > 0 && formData.category_id === 0) {
        setFormData(prev => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch commission rate for the current shop
  const fetchCommissionRate = async () => {
    if (!user?.shop_id) return;
    try {
      const res = await apiClient.get(`/commissions?shop_id=${user.shop_id}`) as any;
      // API returns array or single object
      let rate = 0.1;
      if (Array.isArray(res.data) && res.data.length > 0) {
        rate = parseFloat(res.data[0].rate) / 100;
      } else if (res.data && res.data.rate) {
        rate = parseFloat(res.data.rate) / 100;
      }
      commissionRateCache.current[user.shop_id] = rate;
      setCommissionRate(rate);
    } catch (err) {
      commissionRateCache.current[user.shop_id] = 0.1;
      setCommissionRate(0.1); // fallback to 10%
    }
  };

  const calculateAmounts = () => {
    const total = formData.quantity * formData.unit_price;
    const commission = total * commissionRate;
    const farmerEarning = total - commission;

    setCalculations({
      total_sale_value: total,
      shop_commission: commission,
      farmer_earning: farmerEarning
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.farmer_id) errors.farmer_id = 'Farmer is required';
    if (!formData.buyer_id) errors.buyer_id = 'Buyer is required';
    if (!formData.category_id) errors.category_id = 'Category is required';
    if (!formData.product_name) errors.product_name = 'Product is required';
    if (!formData.quantity || formData.quantity <= 0) errors.quantity = 'Quantity must be greater than 0';
    if (!formData.unit_price || formData.unit_price <= 0) errors.unit_price = 'Unit price must be greater than 0';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { transaction_date, ...transactionData } = formData;
      const now = new Date().toISOString();
      const payload = {
        ...transactionData,
        shop_id: Number(formData.shop_id),
        farmer_id: Number(formData.farmer_id),
        buyer_id: Number(formData.buyer_id),
        category_id: Number(formData.category_id),
        quantity: Number(formData.quantity),
        unit_price: Number(formData.unit_price),
        payments: [
          {
            payer_type: 'BUYER',
            payee_type: 'SHOP',
            amount: Number(buyerPaid),
            status: 'PAID',
            method: buyerPaymentMethod,
            payment_date: now
          },
          {
            payer_type: 'SHOP',
            payee_type: 'FARMER',
            amount: Number(farmerPaid),
            status: 'PAID',
            method: farmerPaymentMethod,
            payment_date: now
          }
        ]
      };
      const response = await apiClient.post('/transactions', payload);
      onSuccess?.(response);
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      setError(error.message || 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
  <Card className="w-full max-w-2xl mx-auto px-2 sm:px-0">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <Calculator className="h-5 w-5" />
        Create New Transaction
      </CardTitle>
    </CardHeader>
    <CardContent>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading form data...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Main Selection Fields - 2-column grid on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {/* Farmer Selection with Search */}
              <div className="mb-2">
                <Label htmlFor="farmer">Farmer *</Label>
                <Select
                  options={farmers.map(farmer => ({
                    value: farmer.id,
                    label: `${farmer.firstname || farmer.username} (${farmer.id})`
                  }))}
                  value={formData.farmer_id ? { value: formData.farmer_id, label: `${farmers.find(f => f.id === formData.farmer_id)?.firstname || farmers.find(f => f.id === formData.farmer_id)?.username} (${formData.farmer_id})` } : null}
                  onChange={(option: { value: number; label: string } | null) => {
                    setFormData(prev => ({ ...prev, farmer_id: option ? option.value : 0 }));
                  }}
                  isClearable
                  placeholder="Search and select farmer"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? '#cbd5e1' : '#e5e7eb', // lighter border
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
                {validationErrors.farmer_id && (
                  <p className="text-sm text-red-500">{validationErrors.farmer_id}</p>
                )}
              </div>
            {/* Buyer Selection with Search */}
              <div className="mb-2">
                <Label htmlFor="buyer">Buyer *</Label>
                <Select
                  options={buyers.map(buyer => ({
                    value: buyer.id,
                    label: `${buyer.firstname || buyer.username} (${buyer.id})`
                  }))}
                  value={formData.buyer_id ? { value: formData.buyer_id, label: `${buyers.find(b => b.id === formData.buyer_id)?.firstname || buyers.find(b => b.id === formData.buyer_id)?.username} (${formData.buyer_id})` } : null}
                  onChange={(option: { value: number; label: string } | null) => {
                    setFormData(prev => ({ ...prev, buyer_id: option ? option.value : 0 }));
                  }}
                  isClearable
                  placeholder="Search and select buyer"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? '#cbd5e1' : '#e5e7eb',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
                {validationErrors.buyer_id && (
                  <p className="text-sm text-red-500">{validationErrors.buyer_id}</p>
                )}
              </div>
            {/* Category Selection with Search */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                value={formData.category_id}
                onChange={e => setFormData(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
                className={`block w-full border rounded p-2 text-sm ${validationErrors.category_id ? 'border-red-500' : ''}`}
              >
                <option value="" disabled>Select category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {validationErrors.category_id && (
                <p className="text-sm text-red-500">{validationErrors.category_id}</p>
              )}
            </div>
            {/* Product Selection with Search */}
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <div className="mb-2">
                <Select
                  options={products.map(product => ({
                    value: product.id,
                    label: `${product.name} (${product.id})`
                  }))}
                  value={formData.product_id ? { value: formData.product_id, label: `${formData.product_name} (${formData.product_id})` } : null}
                  onChange={option => {
                    if (option) {
                      setFormData(prev => ({ ...prev, product_name: option.label.split(' (')[0], product_id: option.value }));
                    } else {
                      setFormData(prev => ({ ...prev, product_name: '', product_id: undefined }));
                    }
                  }}
                  isClearable
                  placeholder="Search and select product"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? '#cbd5e1' : '#e5e7eb',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
              </div>
              {validationErrors.product_name && (
                <p className="text-sm text-red-500">{validationErrors.product_name}</p>
              )}
            </div>
          </div>

          {/* Quantity and Unit Price - 2 columns on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity === 0 ? '' : formData.quantity}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, quantity: val === '' ? 0 : parseFloat(val) }));
                }}
                placeholder="0.00"
                className={validationErrors.quantity ? 'border-red-500' : ''}
                required
              />
              {validationErrors.quantity && (
                <p className="text-sm text-red-500">{validationErrors.quantity}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price (₹) *</Label>
              <Input
                id="unit_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price === 0 ? '' : formData.unit_price}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, unit_price: val === '' ? 0 : parseFloat(val) }));
                }}
                placeholder="0.00"
                className={validationErrors.unit_price ? 'border-red-500' : ''}
                required
              />
              {validationErrors.unit_price && (
                <p className="text-sm text-red-500">{validationErrors.unit_price}</p>
              )}
            </div>
          </div>



          {/* Calculations & Payment Display */}
          {(formData.quantity > 0 && formData.unit_price > 0) && (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Transaction Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Sale Value</p>
                  <p className="font-semibold text-lg">{formatCurrency(calculations.total_sale_value)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Shop Commission ({(commissionRate * 100).toFixed(2)}%)</p>
                  <p className="font-semibold text-lg text-green-600">{formatCurrency(calculations.shop_commission)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Farmer Earning</p>
                  <p className="font-semibold text-lg text-blue-600">{formatCurrency(calculations.farmer_earning)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mt-4">
                <div>
                  <Label>Buyer Paid (to Shop)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={buyerPaid === 0 ? '' : buyerPaid}
                    onChange={e => {
                      const val = e.target.value;
                      setBuyerPaid(val === '' ? 0 : Number(Number(val).toFixed(2)));
                    }}
                    className="text-sm"
                  />
                  <Label className="mt-1">Buyer → Shop Payment Method</Label>
                  <select
                    className="block w-full border rounded p-2 text-xs sm:text-sm mt-1"
                    value={buyerPaymentMethod}
                    onChange={e => setBuyerPaymentMethod(e.target.value as any)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">Bank</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Farmer Paid (by Shop)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={farmerPaid === 0 ? '' : farmerPaid}
                    onChange={e => {
                      const val = e.target.value;
                      setFarmerPaid(val === '' ? 0 : Number(Number(val).toFixed(2)));
                    }}
                    className="text-sm"
                  />
                  <Label className="mt-1">Shop → Farmer Payment Method</Label>
                  <select
                    className="block w-full border rounded p-2 text-xs sm:text-sm mt-1"
                    value={farmerPaymentMethod}
                    onChange={e => setFarmerPaymentMethod(e.target.value as any)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">Bank</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Commission Received</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={commissionReceived === 0 ? '' : commissionReceived}
                    onChange={e => {
                      const val = e.target.value;
                      setCommissionReceived(val === '' ? 0 : Number(Number(val).toFixed(2)));
                    }}
                    className="text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">You can edit payment values and payment methods before creating the transaction.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-full sm:flex-1">
              {(isSubmitting || isLoading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Transaction
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
            )}
          </div>
        </form>
        )}
      </CardContent>
    </Card>
  );
};