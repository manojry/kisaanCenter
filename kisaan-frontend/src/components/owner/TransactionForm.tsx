
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calculator } from 'lucide-react';
import { TransactionPartySelectors, TransactionQuantityPricing, TransactionSummary, TransactionPayments } from '@/features/transactions/components';
import { useTransactionFormLogic } from '../../hooks/useTransactionFormLogic';
import type { Transaction } from '../../types/api';

interface TransactionFormProps {
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  const {
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
  } = useTransactionFormLogic({
    onSuccess,
    onCancel,
    useSimplifiedApi: false,
  });

  // Map ShopProduct[] to Product[] for TransactionPartySelectors
  const mappedProducts = (products || []).map((p: any) => ({
    id: p.id,
    name: p.name || p.product_name || '',
    category_id: p.category_id,
    record_status: p.record_status,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

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
            <TransactionPartySelectors
              farmers={farmers}
              buyers={buyers}
              categories={categories}
              products={formData.category_id ? mappedProducts.filter(p => p.category_id === formData.category_id) : mappedProducts}
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
                  formatCurrency={(amount: number) => `₹${amount.toLocaleString()}`}
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