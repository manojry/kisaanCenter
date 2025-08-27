from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum

# Import from models if needed
from ....models import RecordStatus


class ProductStatus(str, Enum):
    """Product status enumeration"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    DISCONTINUED = "DISCONTINUED"


class ProductBase(BaseModel):
    """Base product schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    description: Optional[str] = Field(None, max_length=500, description="Product description")
    category_id: int = Field(..., gt=0, description="Category ID")
    shop_id: int = Field(..., gt=0, description="Shop ID")
    image_url: Optional[str] = Field(None, max_length=500, description="Product image URL")
    sku: Optional[str] = Field(None, max_length=100, description="Stock Keeping Unit")
    unit: Optional[str] = Field(None, max_length=50, description="Unit of measurement (kg, pieces, etc.)")
    base_price: Optional[Decimal] = Field(None, ge=0, description="Base price for the product")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Product name cannot be empty')
        return v.strip()
    
    @validator('sku')
    def validate_sku(cls, v):
        if v and not v.strip():
            raise ValueError('SKU cannot be empty if provided')
        return v.strip() if v else None
    
    @validator('base_price')
    def validate_base_price(cls, v):
        if v is not None and v < 0:
            raise ValueError('Base price cannot be negative')
        return v


class ProductCreate(ProductBase):
    """Schema for creating a product"""
    initial_stock: Optional[float] = Field(None, ge=0, description="Initial stock quantity")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Organic Tomatoes",
                "description": "Fresh organic tomatoes from local farms",
                "category_id": 1,
                "shop_id": 1,
                "sku": "ORG-TOM-001",
                "unit": "kg",
                "base_price": 120.50,
                "initial_stock": 100.0
            }
        }


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    sku: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=50)
    base_price: Optional[Decimal] = Field(None, ge=0)
    status: Optional[RecordStatus] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Product name cannot be empty')
        return v.strip() if v else v
    
    @validator('sku')
    def validate_sku(cls, v):
        if v is not None and not v.strip():
            raise ValueError('SKU cannot be empty if provided')
        return v.strip() if v else v


class ProductInDB(ProductBase):
    """Product schema for database representation"""
    id: int
    status: RecordStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    
    class Config:
        from_attributes = True


class ProductResponse(ProductInDB):
    """Product response schema with additional computed fields"""
    category_name: Optional[str] = None
    shop_name: Optional[str] = None
    current_stock: Optional[float] = None
    latest_price: Optional[float] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "Organic Tomatoes",
                "description": "Fresh organic tomatoes from local farms",
                "category_id": 1,
                "shop_id": 1,
                "sku": "ORG-TOM-001",
                "unit": "kg",
                "base_price": 120.50,
                "status": "ACTIVE",
                "created_at": "2024-01-01T10:00:00",
                "category_name": "Vegetables",
                "shop_name": "Green Valley Store",
                "current_stock": 85.5,
                "latest_price": 125.00
            }
        }


class ProductListResponse(BaseModel):
    """Response schema for product list"""
    products: List[ProductResponse]
    total: int
    page: int
    size: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "products": [
                    {
                        "id": 1,
                        "name": "Organic Tomatoes",
                        "category_name": "Vegetables",
                        "current_stock": 85.5,
                        "latest_price": 125.00
                    }
                ],
                "total": 50,
                "page": 1,
                "size": 10
            }
        }


class ProductStockResponse(BaseModel):
    """Product stock information response"""
    product_id: int
    product_name: str
    total_quantity: float
    available_quantity: float
    reserved_quantity: float
    farmer_stock_count: int
    stock_details: List[Dict[str, Any]]
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "product_name": "Organic Tomatoes",
                "total_quantity": 100.0,
                "available_quantity": 85.5,
                "reserved_quantity": 14.5,
                "farmer_stock_count": 3,
                "stock_details": [
                    {
                        "farmer_stock_id": 1,
                        "farmer_id": 10,
                        "quantity": 50.0,
                        "available": 42.5,
                        "price": 120.0
                    }
                ]
            }
        }


class ProductAnalyticsResponse(BaseModel):
    """Product analytics response"""
    product_id: int
    product_name: str
    period_days: int
    period_start: str
    period_end: str
    analytics: Dict[str, Any]
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "product_name": "Organic Tomatoes",
                "period_days": 30,
                "period_start": "2024-01-01T00:00:00",
                "period_end": "2024-01-31T23:59:59",
                "analytics": {
                    "total_transactions": 25,
                    "total_quantity_sold": 150.5,
                    "total_revenue": 18812.50,
                    "average_price": 125.0,
                    "current_stock": 85.5,
                    "turnover_rate": 1.76
                }
            }
        }


# Category Schemas
class CategoryBase(BaseModel):
    """Base category schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Category name")
    description: Optional[str] = Field(None, max_length=500, description="Category description")
    parent_id: Optional[int] = Field(None, gt=0, description="Parent category ID for hierarchical categories")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Category name cannot be empty')
        return v.strip()


class CategoryCreate(CategoryBase):
    """Schema for creating a category"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Vegetables",
                "description": "Fresh vegetables and leafy greens",
                "parent_id": None
            }
        }


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[int] = Field(None, gt=0)
    status: Optional[RecordStatus] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Category name cannot be empty')
        return v.strip() if v else v


class CategoryInDB(CategoryBase):
    """Category schema for database representation"""
    id: int
    status: RecordStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    
    class Config:
        from_attributes = True


class CategoryResponse(CategoryInDB):
    """Category response schema with additional computed fields"""
    product_count: Optional[int] = None
    parent_name: Optional[str] = None
    subcategories: Optional[List['CategoryResponse']] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "Vegetables",
                "description": "Fresh vegetables and leafy greens",
                "parent_id": None,
                "status": "ACTIVE",
                "created_at": "2024-01-01T10:00:00",
                "product_count": 25,
                "parent_name": None,
                "subcategories": []
            }
        }


class CategoryListResponse(BaseModel):
    """Response schema for category list"""
    categories: List[CategoryResponse]
    total: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "categories": [
                    {
                        "id": 1,
                        "name": "Vegetables",
                        "product_count": 25
                    },
                    {
                        "id": 2,
                        "name": "Fruits",
                        "product_count": 18
                    }
                ],
                "total": 10
            }
        }


# Price History Schemas
class PriceHistoryBase(BaseModel):
    """Base price history schema"""
    product_id: int = Field(..., gt=0, description="Product ID")
    price: Decimal = Field(..., ge=0, description="Price value")
    
    @validator('price')
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('Price cannot be negative')
        return v


class PriceHistoryCreate(PriceHistoryBase):
    """Schema for creating price history entry"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "price": 125.50
            }
        }


class PriceHistoryResponse(PriceHistoryBase):
    """Price history response schema"""
    id: int
    created_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "product_id": 1,
                "price": 125.50,
                "created_at": "2024-01-15T14:30:00",
                "created_by": 5
            }
        }


# Search and Filter Schemas
class ProductSearchRequest(BaseModel):
    """Product search request schema"""
    query: Optional[str] = Field(None, description="Search query for product name")
    category_id: Optional[int] = Field(None, gt=0, description="Filter by category")
    shop_id: Optional[int] = Field(None, gt=0, description="Filter by shop")
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price filter")
    in_stock_only: Optional[bool] = Field(False, description="Show only products in stock")
    page: Optional[int] = Field(1, ge=1, description="Page number")
    size: Optional[int] = Field(10, ge=1, le=100, description="Page size")
    
    @validator('max_price')
    def validate_price_range(cls, v, values):
        if v is not None and 'min_price' in values and values['min_price'] is not None:
            if v < values['min_price']:
                raise ValueError('Maximum price must be greater than minimum price')
        return v


class ProductBulkUpdateRequest(BaseModel):
    """Bulk update request for products"""
    product_ids: List[int] = Field(..., min_items=1, description="List of product IDs to update")
    update_data: ProductUpdate = Field(..., description="Update data to apply")
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_ids": [1, 2, 3],
                "update_data": {
                    "status": "INACTIVE"
                }
            }
        }


class ProductBulkUpdateResponse(BaseModel):
    """Bulk update response"""
    updated_count: int
    failed_updates: List[Dict[str, Any]] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "updated_count": 2,
                "failed_updates": [
                    {"product_id": 3, "error": "Product not found"}
                ]
            }
        }


# Enable forward references for recursive models
CategoryResponse.model_rebuild()