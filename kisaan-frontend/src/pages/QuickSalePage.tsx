import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { simplifiedApi, farmerProductApi } from '../services/api';
import { useSharedUsers } from '../hooks/useSharedUsers';
import { useSharedCategories } from '../hooks/useSharedCategories';
import { useShopProductsCache } from '../hooks/useShopProductsCache';
import { shopProductsApi } from '../services/api';
import { TransactionPartySelectors, TransactionQuantityPricing, TransactionSummary, TransactionPayments } from '@/features/transactions/components';
import { calculateTransactionAmounts } from '@/features/transactions/utils/transactionCalculations';
import type { TransactionCreate } from '../types/api';
import { Loader2, Calculator } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface Product { 
  id: number; 
  name: string; 
  category_id?: number;
  farmer_price?: number;
}

// Extend TransactionCreate for local form usage
interface TransactionFormData extends TransactionCreate {
  product_id?: number;
}

function QuickSalePageInner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use shared data hooks - no more duplication!
  const { farmers, buyers, isLoading: usersLoading, error: usersError } = useSharedUsers({ enabled: true });
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useSharedCategories({ enabled: true });
  const { getShopProducts, setShopProducts } = useShopProductsCache();
  
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Transaction form state
  const [formData, setFormData] = useState<TransactionFormData>({
    shop_id: user?.shop_id || 0,
    farmer_id: 0, // <-- add this line
    buyer_id: 0,
    category_id: 0,
    product_name: '',
    quantity: 0,
    unit_price: 0
  });
    const [products, setProducts] = useState<Product[]>([]);
  
  // Calculations
  const [calculations, setCalculations] = useState({
    total_sale_value: 0,
    shop_commission: 0,
    farmer_earning: 0
  });
  
  // Commission rate management
  const [commissionRate, setCommissionRate] = useState<number>(0.1);
  const commissionRateCache = useRef<{ [shopId: number]: number }>({});
  
  // Payment fields
  const [buyerPaid, setBuyerPaid] = useState(0);
  const [farmerPaid, setFarmerPaid] = useState(0);
  const [commissionReceived, setCommissionReceived] = useState(0);
  const [buyerPaymentMethod, setBuyerPaymentMethod] = useState<'CASH' | 'BANK' | 'UPI' | 'OTHER'>('CASH');
  const [farmerPaymentMethod, setFarmerPaymentMethod] = useState<'CASH' | 'BANK' | 'UPI' | 'OTHER'>('CASH');
  
  // Add loading timeout to prevent infinite loading
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (usersLoading || categoriesLoading) {
        setHasTimedOut(true);
      }
    }, 10000); // 10 second timeout
    
    if (!usersLoading && !categoriesLoading) {
      clearTimeout(timer);
      setHasTimedOut(false);
    }
    
    return () => clearTimeout(timer);
  }, [usersLoading, categoriesLoading]);
  
  const isLoading = (usersLoading || categoriesLoading) && !hasTimedOut;
  const error = usersError || categoriesError || (hasTimedOut ? 'Data loading timed out. Please refresh the page.' : null);
  
  // Load shop products when categories are ready
  useEffect(() => {
    const loadShopProducts = async () => {
      if (!user?.shop_id || !categories || categories.length === 0) {
        return;
      }
      let shopProducts = getShopProducts(user.shop_id);
      if (!shopProducts) {
        try {
          shopProducts = await shopProductsApi.getShopProducts(user.shop_id, categories);
          setShopProducts(user.shop_id, shopProducts);
        } catch (err) {
          shopProducts = [];
        }
      }
      setProducts((shopProducts || []).map(p => ({
        ...p,
        name: p.name || p.product_name
      })));
    };
    loadShopProducts();
  }, [user?.shop_id, categories]);
  
  // Update products when farmer is selected - show farmer's products first
  useEffect(() => {
    const updateProductsForFarmer = async () => {
      if (!formData.farmer_id || !user?.shop_id) {
        // No farmer selected, show all shop products
        const shopProducts = getShopProducts(user?.shop_id || 0) || [];
        setProducts((shopProducts || []).map(p => ({
          ...p,
          name: p.name || p.product_name
        })));
        return;
      }
      try {
        // Get farmer's specific products
        const farmerResponse = await farmerProductApi.getFarmerProducts(formData.farmer_id);
        const farmerProducts = farmerResponse.success ? (farmerResponse.data || []) : [];
        // Get all shop products
        const shopProducts = getShopProducts(user.shop_id) || [];
        // Combine: farmer products first, then remaining shop products
        const farmerProductIds = new Set(farmerProducts.map((p: any) => p.id));
        const remainingShopProducts = shopProducts.filter(p => !farmerProductIds.has(p.id));
        const combinedProducts = [...farmerProducts, ...remainingShopProducts];
        setProducts((combinedProducts || []).map(p => {
          // Ensure product_id is a number for matching
          const pid = typeof p.product_id === 'string' ? Number(p.product_id) : p.product_id;
          const sid = typeof p.id === 'string' ? Number(p.id) : p.id;
          const shopProducts = getShopProducts(user?.shop_id || 0) || [];
          const matched = shopProducts.find(sp => sp.id === pid || sp.id === sid);
          return {
            ...p,
            name: matched?.name || matched?.product_name || ''
          };
        }));
        // Auto-select first farmer product if available
        if (farmerProducts.length > 0 && !formData.product_name) {
          const firstProduct = farmerProducts[0];
          // Ensure product_id is a number for matching
          const pid = typeof firstProduct.product_id === 'string' ? Number(firstProduct.product_id) : firstProduct.product_id;
          const sid = typeof firstProduct.id === 'string' ? Number(firstProduct.id) : firstProduct.id;
          const shopProducts = getShopProducts(user.shop_id) || [];
          const matched = shopProducts.find(p => p.id === pid || p.id === sid);
          const resolvedName = matched?.name || matched?.product_name || '';
          setFormData(prev => ({
            ...prev,
            product_id: sid,
            product_name: resolvedName,
            unit_price: firstProduct.farmer_price || firstProduct.price || 0,
            category_id: firstProduct.category_id || prev.category_id
          }));
        }
      } catch (err) {
        // Fallback to shop products
        const shopProducts = getShopProducts(user.shop_id) || [];
        setProducts((shopProducts || []).map(p => ({
          ...p,
          name: p.name || p.product_name
        })));
      }
    };
    updateProductsForFarmer();
  }, [formData.farmer_id, user?.shop_id, categories]);
  
  // Calculate amounts when form changes
  useEffect(() => {
    const amounts = calculateTransactionAmounts({
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      commissionRateDecimal: commissionRate
    });
    setCalculations(amounts);
  }, [formData.quantity, formData.unit_price, commissionRate]);
  
  // Auto-set payment amounts based on calculations
  useEffect(() => {
  setBuyerPaid(Number((calculations?.total_sale_value ?? 0).toFixed(2)));
  setFarmerPaid(Number((calculations?.farmer_earning ?? 0).toFixed(2)));
  setCommissionReceived(Number((calculations?.shop_commission ?? 0).toFixed(2)));
  }, [calculations]);
  
  // Commission rate handling
  const fetchCommissionRate = async () => {
    if (!user?.shop_id) return;
    
    try {
      // This would be an API call to get shop commission rate
      // For now, using default
      const rate = 0.1; // 10%
      setCommissionRate(rate);
      commissionRateCache.current[user.shop_id] = rate;
    } catch (err) {
    }
  };
  
  useEffect(() => {
    if (user?.shop_id) {
      if (commissionRateCache.current[user.shop_id] !== undefined) {
        setCommissionRate(commissionRateCache.current[user.shop_id]);
      } else {
        fetchCommissionRate();
      }
    }
  }, [user?.shop_id]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});
    
    try {
      const now = new Date().toISOString();
      // Simplified API handles all calculations automatically
      // Simplified transaction API only needs core fields
      const transactionData = {
        shop_id: formData.shop_id,
        farmer_id: formData.farmer_id,
        buyer_id: formData.buyer_id,
        category_id: formData.category_id || 1, // Ensure non-zero category_id
        product_name: formData.product_name,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        commission_rate: commissionRate * 100, // Convert to percentage
        notes: '',
        payments: [
          {
            payer_type: 'BUYER' as const,
            payee_type: 'SHOP' as const,
            amount: buyerPaid,
            method: buyerPaymentMethod,
            status: 'PAID',
            payment_date: now
          },
          {
            payer_type: 'SHOP' as const,
            payee_type: 'FARMER' as const,
            amount: farmerPaid,
            method: farmerPaymentMethod,
            status: 'PAID',
            payment_date: now
          }
        ]
      };
      const response = await simplifiedApi.createTransaction(transactionData);
      
  if (response.success) {
        toast({
          title: '✅ Sale Created Successfully!',
          description: `Total: ₹${(calculations?.total_sale_value ?? 0).toFixed(2)} | Payments recorded`,
          variant: 'success' // Make toaster green
        });
        // Reset form
        setFormData({
          shop_id: user?.shop_id || 0,
          farmer_id: 0,
          buyer_id: 0,
          category_id: 0,
          product_name: '',
          quantity: 0,
          unit_price: 0
        });
        setBuyerPaid(0);
        setFarmerPaid(0);
        setCommissionReceived(0);
        // Navigate to dashboard after successful sale
        navigate('/owner');
      }
    } catch (error: any) {
      toast({
        title: '❌ Sale Failed',
        description: error.response?.data?.message || error.message || 'Failed to create sale',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Form Data</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calculator className="h-5 w-5" />
          Quick Sale
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create a sale with automatic payment recording
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading form data...</span>
            <div className="text-xs text-muted-foreground mt-2">
              Users: {usersLoading ? 'Loading...' : 'Ready'} | 
              Categories: {categoriesLoading ? 'Loading...' : 'Ready'}
              {hasTimedOut && ' (Timed out - showing partial data)'}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <TransactionPartySelectors
              farmers={farmers}
              buyers={buyers}
              categories={categories}
              products={products}
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
            
            <TransactionQuantityPricing
              quantity={formData.quantity}
              unit_price={formData.unit_price}
              errors={validationErrors}
              onChange={patch => setFormData(prev => ({ ...prev, ...patch }))}
            />
            
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
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoading} 
                className="w-full sm:flex-1"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Sale
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function QuickSalePage() {
  return (
    <ErrorBoundary>
      <QuickSalePageInner />
    </ErrorBoundary>
  );
}