from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional
from ....database import get_db
from ....schemas import ProductCreate, ProductUpdate, APIResponse, PaginationParams
from ..services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])

@router.post(
    "/",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
    description="Create a new product in the system"
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new product:
    
    - **name**: Product name
    - **category_id**: Product category ID
    - **shop_id**: Shop ID where product belongs
    - **description**: Optional product description
    """
    result = ProductService.create_product(db, product)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result


@router.get("/{product_id}", response_model=APIResponse)
def get_product(
    product_id: int = Path(..., description="Product ID"),
    include_relations: bool = Query(False, description="Include related data"),
    db: Session = Depends(get_db)
):
    """Get product by ID with optional relations"""
    result = ProductService.get_product(db, product_id, include_relations)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/", response_model=APIResponse)
def get_products(
    pagination: PaginationParams = Depends(),
    shop_id: Optional[int] = Query(None, description="Filter by shop"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    name: Optional[str] = Query(None, description="Filter by name"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """Get all products with optional filtering"""
    filters = {}
    if shop_id:
        filters['shop_id'] = shop_id
    if category_id:
        filters['category_id'] = category_id
    if name:
        filters['name'] = name
    if status:
        filters['status'] = status
    
    result = ProductService.get_products(db, pagination, filters)
    return result


@router.put("/{product_id}", response_model=APIResponse)
def update_product(
    product_id: int = Path(..., description="Product ID"),
    product_update: ProductUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update product"""
    result = ProductService.update_product(db, product_id, product_update)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.delete("/{product_id}", response_model=APIResponse)
def delete_product(
    product_id: int = Path(..., description="Product ID"),
    db: Session = Depends(get_db)
):
    """Delete product (soft delete)"""
    result = ProductService.delete_product(db, product_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/{product_id}/stock", response_model=APIResponse)
def get_product_stock(
    product_id: int = Path(..., description="Product ID"),
    db: Session = Depends(get_db)
):
    """Get current stock levels for a product"""
    result = ProductService.get_product_stock(db, product_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/{product_id}/price-history", response_model=APIResponse)
def get_product_price_history(
    product_id: int = Path(..., description="Product ID"),
    limit: int = Query(10, description="Number of recent prices"),
    db: Session = Depends(get_db)
):
    """Get price history for a product"""
    result = ProductService.get_product_price_history(db, product_id, limit)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/{product_id}/transactions", response_model=APIResponse)
def get_product_transactions(
    product_id: int = Path(..., description="Product ID"),
    limit: int = Query(20, description="Number of recent transactions"),
    db: Session = Depends(get_db)
):
    """Get recent transactions for a product"""
    result = ProductService.get_product_transactions(db, product_id, limit)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/{product_id}/analytics", response_model=APIResponse)
def get_product_analytics(
    product_id: int = Path(..., description="Product ID"),
    days: int = Query(30, description="Number of days for analytics"),
    db: Session = Depends(get_db)
):
    """Get product analytics"""
    result = ProductService.get_product_analytics(db, product_id, days)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/category/{category_id}", response_model=APIResponse)
def get_products_by_category(
    category_id: int = Path(..., description="Category ID"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db)
):
    """Get all products in a specific category"""
    result = ProductService.get_products_by_category(db, category_id, pagination)
    return result


@router.get("/shop/{shop_id}", response_model=APIResponse)
def get_products_by_shop(
    shop_id: int = Path(..., description="Shop ID"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db)
):
    """Get all products for a specific shop"""
    result = ProductService.get_products_by_shop(db, shop_id, pagination)
    return result