import { useState, useCallback } from 'react';
import { shopProductsApi, farmerProductApi } from '../api';

export function useFarmerProductAssignment(shopId?: number, _farmerId?: number, onAssigned?: () => void) {
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [assignedProductIds, setAssignedProductIds] = useState<number[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchProductsForFarmer = useCallback(async (farmerIdParam?: number) => {
    if (!shopId || !farmerIdParam) return;
    try {
      const shopRes = await shopProductsApi.getShopProducts(shopId, []);
      setShopProducts(shopRes);
      const farmerRes = await farmerProductApi.getFarmerProducts(farmerIdParam);
      setAssignedProductIds((farmerRes.data || []).map((p: any) => p.id));
      setSelectedProductIds([]);
    } catch (err) {
      setShopProducts([]);
      setAssignedProductIds([]);
      setSelectedProductIds([]);
    }
  }, [shopId]);

  const handleAssignProducts = useCallback(async (farmerIdParam?: number, productIds: number[] = []) => {
    if (!farmerIdParam || productIds.length === 0) return;
    setAssignLoading(true);
    try {
      for (const pid of productIds) {
        await farmerProductApi.assignProduct(farmerIdParam, pid);
      }
      if (onAssigned) onAssigned();
    } catch (err) {
      alert('Failed to assign products');
    } finally {
      setAssignLoading(false);
    }
  }, [onAssigned]);

  return {
    shopProducts,
    assignedProductIds,
    selectedProductIds,
    setSelectedProductIds,
    assignLoading,
    fetchProductsForFarmer,
    handleAssignProducts
  };
}
