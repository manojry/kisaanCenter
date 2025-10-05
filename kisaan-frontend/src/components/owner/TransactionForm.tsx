import { formatCurrency } from '@/utils/format';
import React, { useState, useEffect, useRef } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { useShopProductsCache } from '../../hooks/useShopProductsCache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Imports for UI primitives removed after modular refactor (Label, Input, Select) handled inside subcomponents
import { Loader2, Calculator } from 'lucide-react';
import { usersApi, transactionsApi } from '../../services/api';
import { buildTransactionPayload } from '../../utils/buildTransactionPayload';
import { TransactionPartySelectors, TransactionQuantityPricing, TransactionSummary, TransactionPayments } from '@/features/transactions/components';
import { calculateTransactionAmounts } from '@/features/transactions/utils/transactionCalculations';
import { apiClient } from '../../services/apiClient';
import type { TransactionCreate, User, Category } from '../../types/api';
import { useToast } from '@/hooks/use-toast';
// Extend TransactionCreate for local form usage to include product_id
interface TransactionFormData extends TransactionCreate {
  product_id?: number;
}
import { useAuth } from '../../context/AuthContext';

// Use the Product type from types/api for full compatibility
import type { Product } from '../../types/api';

import type { Transaction } from '../../types/api';
interface TransactionFormProps {
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  // State for product dropdown visibility
  const { user } = useAuth();
  // Debug: Log user and shopId on mount
  useEffect(() => {
    console.log('[TransactionForm] user:', user);
    console.log('[TransactionForm] shopId:', user?.shop_id);
  }, [user]);
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
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

  // Auto-select category if only one is available
  useEffect(() => {
    if (categories.length === 1 && formData.category_id !== categories[0].id) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [categories, formData.category_id]);

  useEffect(() => {
    calculateAmounts();
  }, [formData.quantity, formData.unit_price, commissionRate]);

  // Set default payment values when calculations change, rounded to 2 decimals
  useEffect(() => {
    setBuyerPaid(Number((calculations?.total_sale_value ?? 0).toFixed(2)));
    setFarmerPaid(Number((calculations?.farmer_earning ?? 0).toFixed(2)));
    setCommissionReceived(Number((calculations?.shop_commission ?? 0).toFixed(2)));
  }, [calculations.total_sale_value, calculations.farmer_earning, calculations.shop_commission]);

  const fetchData = async () => {
  console.trace('[TransactionForm] fetchData called');
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

      // Fetch shop-specific categories
      let cats: Category[] = [];
      if (user?.shop_id) {
        try {
          const response = await apiClient.get<{ data?: Category[] }>(`/shops/${user.shop_id}/categories`);
          cats = (response && response.data) || [];
        } catch (err) {
          console.error('[TransactionForm] Error fetching shop categories:', err);
          cats = [];
        }
      }
      setCategories(cats);

      // Only fetch products if shop_id is valid
      if (user?.shop_id) {
        const cached = getShopProducts(user.shop_id);
        if (cached && cached.length > 0) {
          console.log('[TransactionForm] Using cached products for shop_id', user.shop_id, cached);
          setProducts(cached);
        } else {
          console.log('[TransactionForm] Fetching products from API for shop_id', user.shop_id);
          try {
            const productsResponseRaw = await apiClient.get(`/shops/${user.shop_id}/products`);
            // productsResponseRaw is expected to be an AxiosResponse<{ data: Product[] }>
            // If not, fallback to unknown and type guard
            let productsResponse: { data?: Product[] };
            if (typeof productsResponseRaw === 'object' && productsResponseRaw !== null && 'data' in productsResponseRaw) {
              productsResponse = productsResponseRaw as { data?: Product[] };
            } else {
              productsResponse = { data: [] };
            }
            const prods = productsResponse.data || [];
            console.log('[TransactionForm] Products fetched from API:', prods);
            // Map/fix: ensure all required Product fields exist
            const validProds = prods
              .filter((p: unknown) => {
                if (typeof p === 'object' && p !== null && 'id' in p && 'name' in p && 'category_id' in p) {
                  return typeof (p as { id: unknown }).id === 'number' && typeof (p as { name: unknown }).name === 'string' && typeof (p as { category_id: unknown }).category_id === 'number';
                }
                return false;
              })
              .map((p: unknown) => {
                if (typeof p === 'object' && p !== null) {
                  const obj = p as Record<string, unknown>;
                  const mapped: Product = {
                    id: obj.id as number,
                    name: obj.name as string,
                    category_id: obj.category_id as number,
                    record_status: typeof obj.record_status === 'string' ? (obj.record_status as 'active' | 'inactive') : 'active',
                    created_at: typeof obj.created_at === 'string' ? obj.created_at as string : '',
                  };
                  if (typeof obj.updated_at === 'string') {
                    mapped.updated_at = obj.updated_at as string;
                  }
                  return mapped;
                }
                // fallback: skip invalid
                return null;
              })
              .filter((p): p is Product => p !== null);
            const filteredProds: Product[] = validProds.filter((p): p is Product => p !== null);
            setShopProducts(user.shop_id, filteredProds);
            setProducts(filteredProds);
          } catch (err) {
            console.error('[TransactionForm] Error fetching products:', err);
            setProducts([]);
          }
        }
      } else {
        console.log('[TransactionForm] No valid shop_id, products not fetched.');
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
  type CommissionResponse = { data: { rate: string }[] } | { data: { rate: string } };
  const fetchCommissionRate = async () => {
    if (!user?.shop_id) return;
    try {
      const res = await apiClient.get(`/commissions?shop_id=${user.shop_id}`) as unknown;
      let rate = 0.1;
      if (
        typeof res === 'object' && res !== null && 'data' in res &&
        Array.isArray((res as CommissionResponse).data) && ((res as { data: { rate: string }[] }).data.length > 0)
      ) {
        rate = parseFloat(((res as { data: { rate: string }[] }).data[0].rate)) / 100;
      } else if (
        typeof res === 'object' && res !== null && 'data' in res &&
        (res as { data: { rate: string } }).data && (res as { data: { rate: string } }).data.rate
      ) {
        rate = parseFloat(((res as { data: { rate: string } }).data.rate)) / 100;
      }
      commissionRateCache.current[user.shop_id] = rate;
      setCommissionRate(rate);
    } catch (err) {
      console.error('Failed to fetch commission rate:', err);
      commissionRateCache.current[user.shop_id] = 0.1;
      setCommissionRate(0.1); // fallback to 10%
    }
  };

  const calculateAmounts = () => {
    const result = calculateTransactionAmounts({
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      commissionRateDecimal: commissionRate
    });
    setCalculations(result);
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Build base payload using TransactionCreate shape + additional backend-supported fields
      // Backend computes totals but we send explicit commission_rate to avoid relying on shop default.
      const now = new Date().toISOString();
      const payload = buildTransactionPayload({
        shop_id: Number(formData.shop_id),
        farmer_id: Number(formData.farmer_id),
        buyer_id: Number(formData.buyer_id),
        category_id: Number(formData.category_id),
        product_name: formData.product_name,
        product_id: formData.product_id,
        quantity: Number(formData.quantity),
        unit_price: Number(formData.unit_price),
        commission_rate_decimal: commissionRate,
        totals: {
          total_amount: calculations.total_sale_value,
          commission_amount: calculations.shop_commission,
          farmer_earning: calculations.farmer_earning
        },
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
      });

      const response = await transactionsApi.create(payload);
      if (response && response.data) {
        onSuccess?.(response.data as Transaction);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      let message = 'Failed to create transaction';
      if (error && typeof error === 'object' && 'message' in error) {
        message = (error as { message?: string }).message || message;
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use global formatCurrency utility for all currency display

  return (
  <Card className="w-full max-w-2xl mx-auto px-2 sm:px-0">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <Calculator className="h-5 w-5" />
        Create New Transaction
      </CardTitle>
    </CardHeader>
    <CardContent>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading form data...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Filter products by selected category for dropdown */}
          {(() => {
            const filteredProducts = formData.category_id
              ? products.filter(p => p.category_id === formData.category_id)
              : products;
            return (
              <TransactionPartySelectors
                farmers={farmers}
                buyers={buyers}
                categories={categories}
                products={filteredProducts}
                values={{
                  farmer_id: formData.farmer_id,
                  buyer_id: formData.buyer_id,
                  category_id: formData.category_id,
                  product_id: formData.product_id,
                  product_name: formData.product_name
                }}
                errors={validationErrors}
                onChange={patch => setFormData(prev => ({ ...prev, ...patch }))}
              />
            );
          })()}

          <TransactionQuantityPricing
            quantity={formData.quantity}
            unit_price={formData.unit_price}
            errors={validationErrors}
            onChange={patch => setFormData(prev => ({ ...prev, ...patch }))}
          />



          {/* Calculations & Payment Display */}
          {(formData.quantity > 0 && formData.unit_price > 0) && (
            <>
              <TransactionSummary
                total_sale_value={calculations.total_sale_value}
                shop_commission={calculations.shop_commission}
                farmer_earning={calculations.farmer_earning}
                commissionRate={commissionRate}
                onCommissionRateChange={setCommissionRate}
                formatCurrency={formatCurrency}
              />
              <TransactionPayments
                buyerPaid={buyerPaid}
                farmerPaid={farmerPaid}
                commissionReceived={commissionReceived}
                buyerPaymentMethod={buyerPaymentMethod}
                farmerPaymentMethod={farmerPaymentMethod}
                onChange={patch => {
                  if (patch.buyerPaid !== undefined) setBuyerPaid(patch.buyerPaid);
                  if (patch.farmerPaid !== undefined) setFarmerPaid(patch.farmerPaid);
                  if (patch.commissionReceived !== undefined) setCommissionReceived(patch.commissionReceived);
                  if (patch.buyerPaymentMethod) setBuyerPaymentMethod(patch.buyerPaymentMethod);
                  if (patch.farmerPaymentMethod) setFarmerPaymentMethod(patch.farmerPaymentMethod);
                }}
              />
            </>
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