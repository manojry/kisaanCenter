
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { productManagementApi } from '../api/productManagementApi';

interface Product {
  id: number;
  name: string;
  category_name: string;
  unit: string;
  description?: string;
}

interface ProductsByCategory {
  [category: string]: Product[];
}

interface ShopProduct {
  shop_product_id: number;
  product_id: number;
  name: string;
  unit: string;
  default_price?: number;
}

interface ProductAssignmentWizardProps {
  shopId: number;
  farmerId?: number;
  mode: 'shop-setup' | 'farmer-assignment';
  onComplete: () => void;
}

export const ProductAssignmentWizard: React.FC<ProductAssignmentWizardProps> = ({
  shopId,
  farmerId,
  mode,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [allProducts, setAllProducts] = useState<ProductsByCategory>({});
  const [shopProducts, setShopProducts] = useState<ProductsByCategory>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [farmerAssignments, setFarmerAssignments] = useState<Map<number, any>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [mode, shopId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (mode === 'shop-setup') {
        // Load all available products for shop setup
        const response = await productManagementApi.getAllProducts();
        setAllProducts(response.data.products_by_category);
      } else {
        // Load shop's catalog for farmer assignment
        const response = await productManagementApi.getShopCatalog(shopId);
        setShopProducts(response.data.products_by_category);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelection = (productId: number, selected: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (selected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleFarmerAssignment = (shopProductId: number, assignment: any) => {
    const newAssignments = new Map(farmerAssignments);
    if (assignment.selected) {
      newAssignments.set(shopProductId, {
        shop_product_id: shopProductId,
        preferred_price: assignment.preferred_price,
        notes: assignment.notes
      });
    } else {
      newAssignments.delete(shopProductId);
    }
    setFarmerAssignments(newAssignments);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'shop-setup') {
        await productManagementApi.setupShopProducts(shopId, {
          selected_product_ids: Array.from(selectedProducts)
        });
      } else {
        await productManagementApi.assignFarmerProducts(farmerId!, {
          product_assignments: Array.from(farmerAssignments.values())
        });
      }
      onComplete();
    } catch (error) {
      console.error('Failed to save assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderShopSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Select Products for Your Shop</h2>
        <p className="text-gray-600 mt-2">
          Choose which products you want to sell in your shop. You can modify this later.
        </p>
      </div>

      <Tabs defaultValue={Object.keys(allProducts)[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {Object.keys(allProducts).map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
              <Badge variant="secondary" className="ml-2">
                {allProducts[category]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(allProducts).map(([category, products]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={(checked) => handleProductSelection(product.id, !!checked)}
                          />
                          <Label htmlFor={`product-${product.id}`} className="font-medium">
                            {product.name}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{product.unit}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  const renderFarmerAssignment = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Assign Products to Farmer</h2>
        <p className="text-gray-600 mt-2">
          Select which products you want to assign to this farmer and set preferred prices.
        </p>
      </div>

      <Tabs defaultValue={Object.keys(shopProducts)[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {Object.keys(shopProducts).map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
              <Badge variant="secondary" className="ml-2">
                {shopProducts[category]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(shopProducts).map(([category, products]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <Card key={product.shop_product_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`shop-product-${product.shop_product_id}`}
                            checked={farmerAssignments.has(product.shop_product_id)}
                            onCheckedChange={(checked) => handleFarmerAssignment(product.shop_product_id, {
                              selected: !!checked,
                              preferred_price: farmerAssignments.get(product.shop_product_id)?.preferred_price || '',
                              notes: farmerAssignments.get(product.shop_product_id)?.notes || ''
                            })}
                          />
                          <Label htmlFor={`shop-product-${product.shop_product_id}`} className="font-medium">
                            {product.name}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{product.unit}</p>
                        {farmerAssignments.has(product.shop_product_id) && (
                          <div className="mt-2 space-y-2">
                            <div>
                              <Label htmlFor={`price-${product.shop_product_id}`} className="text-xs">
                                Preferred Price
                              </Label>
                              <Input
                                id={`price-${product.shop_product_id}`}
                                type="number"
                                placeholder="Enter price"
                                value={farmerAssignments.get(product.shop_product_id)?.preferred_price || ''}
                                onChange={(e) => handleFarmerAssignment(product.shop_product_id, {
                                  selected: true,
                                  preferred_price: e.target.value,
                                  notes: farmerAssignments.get(product.shop_product_id)?.notes || ''
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`notes-${product.shop_product_id}`} className="text-xs">
                                Notes
                              </Label>
                              <Input
                                id={`notes-${product.shop_product_id}`}
                                placeholder="Add notes"
                                value={farmerAssignments.get(product.shop_product_id)?.notes || ''}
                                onChange={(e) => handleFarmerAssignment(product.shop_product_id, {
                                  selected: true,
                                  preferred_price: farmerAssignments.get(product.shop_product_id)?.preferred_price || '',
                                  notes: e.target.value
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">
              {mode === 'shop-setup' ? 'Shop Product Setup' : 'Farmer Product Assignment'}
            </h1>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || (mode === 'shop-setup' ? selectedProducts.size === 0 : farmerAssignments.size === 0)}
              >
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : mode === 'shop-setup' ? renderShopSetup() : renderFarmerAssignment()}
        </CardContent>
      </Card>
    </div>
  );
};

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from src.database.connection import get_db
from src.features.product.services.product_assignment_service import ProductAssignmentService
from src.core.auth import get_current_user
from src.features.auth.models.user import User

router = APIRouter(prefix="/api/v1/product-management", tags=["Product Management"])

# Request Models
class ShopProductSetupRequest(BaseModel):
    selected_product_ids: List[int]

class ProductAssignmentItem(BaseModel):
    shop_product_id: int
    preferred_price: float = None
    notes: str = ""

class FarmerProductAssignmentRequest(BaseModel):
    product_assignments: List[ProductAssignmentItem]

# Endpoints
@router.get("/products/all")
async def get_all_products_by_category(
    category_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all products organized by category (for superadmin/owner selection)"""
    if current_user.role not in ["superadmin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    result = ProductAssignmentService.get_all_products_by_category(db)
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    return result

@router.post("/shop/{shop_id}/products/setup")
async def setup_shop_products(
    shop_id: int,
    request: ShopProductSetupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Setup which products a shop will sell"""
    # Validate user can manage this shop
    if current_user.role == "owner" and current_user.shop_id != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this shop"
        )
    elif current_user.role not in ["superadmin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to setup shop products"
        )
    
    result = ProductAssignmentService.setup_shop_products(
        db, shop_id, request.selected_product_ids
    )
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    return result

@router.get("/shop/{shop_id}/products/catalog")
async def get_shop_catalog(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get shop's product catalog organized by category"""
    # Validate user can access this shop
    if current_user.role == "owner" and current_user.shop_id != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this shop"
        )
    elif current_user.role == "farmer" and current_user.shop_id != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this shop"
        )
    elif current_user.role not in ["superadmin", "owner", "employee", "farmer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )

    result = ProductAssignmentService.get_shop_product_catalog(db, shop_id)
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    return result

@router.post("/farmer/{farmer_id}/products/assign")
async def assign_farmer_products(
    farmer_id: int,
    request: FarmerProductAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Owner assigns specific products to a farmer"""
    # Verify user is owner/employee of the shop
    if current_user.role not in ["owner", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to assign farmer products"
        )
    
    result = ProductAssignmentService.assign_farmer_products(
        db, farmer_id, current_user.shop_id, request.product_assignments
    )
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    return result

@router.get("/farmer/{farmer_id}/products/available")
async def get_farmer_available_products(
    farmer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get products available for a farmer (for transaction entry)"""
    # Validate user can access this farmer's data
    if current_user.role == "farmer" and current_user.id != farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this farmer's data"
        )
    elif current_user.role not in ["superadmin", "owner", "employee", "farmer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )

    result = ProductAssignmentService.get_farmer_available_products(
        db, farmer_id, current_user.shop_id
    )
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    return result

@router.get("/shop/{shop_id}/farmers-products/summary")
async def get_farmers_products_summary(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summary of which farmers are assigned which products"""
    # Validate user can access this shop
    if current_user.role == "owner" and current_user.shop_id != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this shop"
        )
    elif current_user.role not in ["superadmin", "owner", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )

    result = ProductAssignmentService.get_farmers_products_summary(db, shop_id)
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    return result
