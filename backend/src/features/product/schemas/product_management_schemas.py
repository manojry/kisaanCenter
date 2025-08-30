
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from decimal import Decimal

class ProductCategoryRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    display_order: int
    is_active: bool

class ProductRead(BaseModel):
    id: int
    name: str
    category_id: int
    category_name: str
    description: Optional[str]
    unit: str
    is_active: bool

class ShopProductSetupRequest(BaseModel):
    selected_product_ids: List[int] = Field(..., min_items=1)

class ShopProductRead(BaseModel):
    id: int
    product_id: int
    product_name: str
    category_name: str
    display_name: Optional[str]
    default_price: Optional[Decimal]
    unit: str
    is_active: bool

class ProductAssignmentItem(BaseModel):
    shop_product_id: int
    preferred_price: Optional[Decimal] = None
    notes: Optional[str] = None

class FarmerProductAssignmentRequest(BaseModel):
    product_assignments: List[ProductAssignmentItem] = Field(..., min_items=1)

class FarmerProductRead(BaseModel):
    farmer_product_id: int
    product_id: int
    shop_product_id: int
    name: str
    unit: str
    preferred_price: Optional[Decimal]
    default_price: Optional[Decimal]
    notes: Optional[str]

class FarmerProductsSummary(BaseModel):
    farmer_id: int
    farmer_name: str
    assigned_products: List[FarmerProductRead]
    total_products: int
