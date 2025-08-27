"""
Product Feature Module

This module handles all product-related functionality including:
- Product management (CRUD operations)
- Category management
- Price history tracking
- Stock management integration
- Product analytics and reporting

Key Components:
- API endpoints for product operations
- Business logic services
- Data models for products and categories
- CRUD operations for database interactions
- Pydantic schemas for request/response validation

Features:
- Comprehensive product management
- Category hierarchy support
- Price history tracking
- Stock level monitoring
- Transaction analytics
- Search and filtering capabilities
- Bulk operations support
"""

from .api.product_endpoints import router as product_router
from .services.product_service import ProductService
from .models.product import Product, ProductPriceHistory, Category
from .crud.product_crud import ProductCRUD, CategoryCRUD
from .schemas.product_schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductStockResponse,
    ProductAnalyticsResponse,
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListResponse,
    PriceHistoryCreate,
    PriceHistoryResponse,
    ProductSearchRequest,
    ProductBulkUpdateRequest,
    ProductBulkUpdateResponse
)

__all__ = [
    # Router
    "product_router",
    
    # Services
    "ProductService",
    
    # Models
    "Product",
    "ProductPriceHistory", 
    "Category",
    
    # CRUD
    "ProductCRUD",
    "CategoryCRUD",
    
    # Schemas
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductListResponse",
    "ProductStockResponse",
    "ProductAnalyticsResponse",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "CategoryListResponse",
    "PriceHistoryCreate",
    "PriceHistoryResponse",
    "ProductSearchRequest",
    "ProductBulkUpdateRequest",
    "ProductBulkUpdateResponse"
]