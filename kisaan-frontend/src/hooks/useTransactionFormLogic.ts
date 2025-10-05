import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useSharedUsers } from '../hooks/useSharedUsers';
import { useSharedCategories } from '../hooks/useSharedCategories';
import { useSharedShopProducts } from '../hooks/useShopProductsCache';
import { farmerProductApi, simplifiedApi, transactionsApi } from '../services/api';
import { calculateTransactionAmounts } from '@/features/transactions/utils/transactionCalculations';

import type { TransactionCreate, Product, Transaction } from '../types/api';

// Local product type for unified transaction logic
type QuickSaleProduct = Product & {
  product_id?: number | string;
  product_name?: string;
  farmer_price?: number;
  price?: number;
  [key: string]: any;
};

export interface TransactionFormData extends TransactionCreate {
  product_id?: number;
}

export function useTransactionFormLogic({
  onSuccess,
  onCancel,
  mode = 'sale', // 'sale' or 'purchase' (future-proof)
  initialValues = {},
  useSimplifiedApi = false,
}: {
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
  mode?: 'sale' | 'purchase';
  initialValues?: Partial<TransactionFormData>;
  useSimplifiedApi?: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { farmers, buyers, isLoading: usersLoading, error: usersError } = useSharedUsers({ enabled: true });
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useSharedCategories({ enabled: true });
  const { products: shopProducts, isLoading: productsLoading, error: productsError } = useSharedShopProducts(user?.shop_id || 0);

  const [formData, setFormData] = useState<TransactionFormData>({
    shop_id: user?.shop_id || 0,
    farmer_id: 0,
    buyer_id: 0,
    category_id: 0,
    product_name: '',
    quantity: 0,
    unit_price: 0,
    ...initialValues,
  });
  const [products, setProducts] = useState<QuickSaleProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [calculations, setCalculations] = useState({
    total_sale_value: 0,
    shop_commission: 0,
    farmer_earning: 0,
  });
  const [commissionRate, setCommissionRate] = useState<number>(0.1);
  const commissionRateCache = useRef<{ [shopId: number]: number }>({});
  const [buyerPaid, setBuyerPaid] = useState(0);
  const [farmerPaid, setFarmerPaid] = useState(0);
  const [commissionReceived, setCommissionReceived] = useState(0);
  const [buyerPaymentMethod, setBuyerPaymentMethod] = useState<'CASH' | 'BANK' | 'UPI' | 'OTHER'>('CASH');
  const [farmerPaymentMethod, setFarmerPaymentMethod] = useState<'CASH' | 'BANK' | 'UPI' | 'OTHER'>('CASH');

  // Loading/error state
  const isLoading = usersLoading || categoriesLoading || productsLoading;
  const error = usersError || categoriesError || productsError;

  // Load products for shop/farmer
  useEffect(() => {
    if (!user?.shop_id || !categories || categories.length === 0) {
      setProducts([]);
      return;
    }
    setProducts((shopProducts || []).map((p: QuickSaleProduct) => ({
      ...p,
      name: p.name || p.product_name || '',
      product_name: p.product_name || p.name || '',
    })));
  }, [user?.shop_id, categories, shopProducts]);

  // Update products when farmer is selected - show farmer's products first
  useEffect(() => {
    const updateProductsForFarmer = async () => {
      if (!formData.farmer_id || !user?.shop_id) {
        setProducts((shopProducts || []).map((p: QuickSaleProduct) => ({
          ...p,
          name: p.name || p.product_name || '',
          product_name: p.product_name || p.name || '',
        })));
        return;
      }
      try {
        const farmerResponse = await farmerProductApi.getFarmerProducts(formData.farmer_id);
        const farmerProducts = farmerResponse.success ? (farmerResponse.data || []) : [];
        const farmerProductIds = new Set((farmerProducts as QuickSaleProduct[]).map((p) => p.id));
        const remainingShopProducts = (shopProducts || []).filter((p: QuickSaleProduct) => !farmerProductIds.has(p.id));
        const combinedProducts = [...(farmerProducts as QuickSaleProduct[]), ...remainingShopProducts];
        setProducts((combinedProducts as QuickSaleProduct[] || []).map((p) => {
          const qp = p as QuickSaleProduct;
          const pid = typeof qp.product_id === 'string' ? Number(qp.product_id) : qp.product_id;
          const sid = typeof qp.id === 'string' ? Number(qp.id) : qp.id;
          const matched = (shopProducts || []).find((sp) => (sp as QuickSaleProduct).id === pid || (sp as QuickSaleProduct).id === sid) as QuickSaleProduct | undefined;
          return {
            ...qp,
            name: qp.name || qp.product_name || (matched && (matched.name || matched.product_name)) || '',
            product_name: qp.product_name || qp.name || (matched && (matched.product_name || matched.name)) || '',
          };
        }));
        // Auto-select first farmer product if available
        if (farmerProducts.length > 0 && !formData.product_name) {
          const firstProduct = farmerProducts[0] as QuickSaleProduct;
          const pid = typeof firstProduct.product_id === 'string' ? Number(firstProduct.product_id) : firstProduct.product_id;
          const sid = typeof firstProduct.id === 'string' ? Number(firstProduct.id) : firstProduct.id;
          const matched = (shopProducts || []).find((p) => (p as QuickSaleProduct).id === pid || (p as QuickSaleProduct).id === sid) as QuickSaleProduct | undefined;
          const resolvedName = firstProduct.product_name || firstProduct.name || (matched && (matched.product_name || matched.name)) || '';
          setFormData(prev => ({
            ...prev,
            product_id: sid,
            product_name: resolvedName,
            unit_price: (firstProduct.farmer_price ?? firstProduct.price ?? 0),
            category_id: firstProduct.category_id ?? prev.category_id,
          }));
        }
      } catch {
        setProducts((shopProducts || []).map((p) => {
          const qp = p as QuickSaleProduct;
          return {
            ...qp,
            name: qp.name || qp.product_name || '',
            product_name: qp.product_name || qp.name || '',
          };
        }));
      }
    };
    updateProductsForFarmer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.farmer_id, user?.shop_id, categories]);

  // Calculations
  useEffect(() => {
    const amounts = calculateTransactionAmounts({
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      commissionRateDecimal: commissionRate,
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
    // This would be an API call to get shop commission rate
    // For now, using default
    const rate = 0.1; // 10%
    setCommissionRate(rate);
    commissionRateCache.current[user.shop_id] = rate;
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

  // Submission handler
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});
    try {
      const now = new Date().toISOString();
      const transactionData = {
        shop_id: formData.shop_id,
        farmer_id: formData.farmer_id,
        buyer_id: formData.buyer_id,
        category_id: formData.category_id || 1,
        product_name: formData.product_name,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        commission_rate: commissionRate * 100,
        notes: '',
        payments: [
          {
            payer_type: 'BUYER' as const,
            payee_type: 'SHOP' as const,
            amount: buyerPaid,
            method: buyerPaymentMethod,
            status: 'PAID',
            payment_date: now,
          },
          {
            payer_type: 'SHOP' as const,
            payee_type: 'FARMER' as const,
            amount: farmerPaid,
            method: farmerPaymentMethod,
            status: 'PAID',
            payment_date: now,
          },
        ],
      };
      let response;
      if (useSimplifiedApi) {
        response = await simplifiedApi.createTransaction(transactionData);
      } else {
        response = await transactionsApi.create(transactionData);
      }
      if (response.success) {
        toast({
          title: '✅ Sale Created Successfully!',
          description: `Total: ₹${(calculations?.total_sale_value ?? 0).toFixed(2)} | Payments recorded`,
          variant: 'success',
        });
  if (onSuccess && response.data) onSuccess(response.data as Transaction);
      }
    } catch (error) {
      let message = 'Failed to create sale';
      if (error && typeof error === 'object') {
        if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
          message = (error.response.data as { message?: string }).message || message;
        } else if ('message' in error && typeof error.message === 'string') {
          message = error.message;
        }
      }
      toast({
        title: '❌ Sale Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, commissionRate, buyerPaid, buyerPaymentMethod, farmerPaid, farmerPaymentMethod, calculations, onSuccess, toast, useSimplifiedApi]);

  return {
    formData,
    setFormData,
    products,
    farmers,
    buyers,
    categories,
    isLoading,
    error,
    isSubmitting,
    validationErrors,
    setValidationErrors,
    calculations,
    commissionRate,
    setCommissionRate,
    buyerPaid,
    setBuyerPaid,
    farmerPaid,
    setFarmerPaid,
    commissionReceived,
    setCommissionReceived,
    buyerPaymentMethod,
    setBuyerPaymentMethod,
    farmerPaymentMethod,
    setFarmerPaymentMethod,
    handleSubmit,
    onCancel,
  };
}
