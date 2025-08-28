"""
Owner Product & Stock Management API

This module provides APIs for shop owners to manage their product catalog,
farmer deliveries, stock adjustments, and inventory tracking.

Features:
- Product catalog management (CRUD)
- Farmer stock management
- Stock adjustments and corrections
- Inventory tracking and analytics
- Price history management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

from ..database import get_db
from ..models import (
    Product, FarmerStock, StockAdjustment, ProductPriceHistory, Category,
    User, UserRole, StockStatus, RecordStatus, AdjustmentType
)
from ..services.user_service import UserService, get_current_user

router = APIRouter(prefix="/owner/products", tags=["Owner Product Management"])

# Product Management Endpoints

@router.post("/", summary="Create new product in shop catalog")
async def create_product(
    name: str,
    category_id: Optional[int] = None,
    initial_price: Optional[Decimal] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product in the owner's shop catalog"""
    
    # Verify owner role and get shop
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    if not current_user.shop_id:
        raise HTTPException(status_code=400, detail="User not associated with any shop")
    
    # Check if product already exists in shop
    existing = db.query(Product).filter(
        Product.shop_id == current_user.shop_id,
        Product.name == name,
        Product.status == RecordStatus.ACTIVE
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Product already exists in shop")
    
    # Create product
    product = Product(
        shop_id=current_user.shop_id,
        name=name,
        category_id=category_id,
        status=RecordStatus.ACTIVE
    )
    
    db.add(product)
    db.flush()
    
    # Add initial price if provided
    if initial_price:
        price_history = ProductPriceHistory(
            product_id=product.id,
            created_by=current_user.id,
            price=initial_price,
            status=RecordStatus.ACTIVE
        )
        db.add(price_history)
    
    db.commit()
    db.refresh(product)
    
    return {
        "id": product.id,
        "name": product.name,
        "category_id": product.category_id,
        "shop_id": product.shop_id,
        "initial_price": initial_price,
        "created_at": product.created_at,
        "status": product.status
    }

@router.get("/", summary="Get all products in shop with stock info")
async def get_shop_products(
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all products in the owner's shop with current stock information"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    query = db.query(Product).filter(Product.shop_id == current_user.shop_id)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if status:
        query = query.filter(Product.status == status)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    products = query.offset(offset).limit(limit).all()
    
    # Enhance with stock information
    product_data = []
    for product in products:
        # Get current stock quantity
        total_stock = db.query(FarmerStock).filter(
            FarmerStock.product_id == product.id,
            FarmerStock.shop_id == current_user.shop_id,
            FarmerStock.status == StockStatus.ACTIVE
        ).count()
        
        # Get latest price
        latest_price = db.query(ProductPriceHistory).filter(
            ProductPriceHistory.product_id == product.id,
            ProductPriceHistory.status == RecordStatus.ACTIVE
        ).order_by(ProductPriceHistory.created_at.desc()).first()
        
        product_data.append({
            "id": product.id,
            "name": product.name,
            "category_id": product.category_id,
            "status": product.status,
            "total_stock_entries": total_stock,
            "latest_price": latest_price.price if latest_price else None,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        })
    
    return {
        "products": product_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{product_id}", summary="Get product details with stock history")
async def get_product_details(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed product information including stock and price history"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Get product
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == current_user.shop_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get farmer stocks
    farmer_stocks = db.query(FarmerStock).filter(
        FarmerStock.product_id == product_id,
        FarmerStock.shop_id == current_user.shop_id
    ).all()
    
    # Get price history
    price_history = db.query(ProductPriceHistory).filter(
        ProductPriceHistory.product_id == product_id
    ).order_by(ProductPriceHistory.created_at.desc()).limit(10).all()
    
    return {
        "product": {
            "id": product.id,
            "name": product.name,
            "category_id": product.category_id,
            "status": product.status,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        },
        "farmer_stocks": [
            {
                "id": stock.id,
                "farmer_user_id": stock.farmer_user_id,
                "quantity": stock.quantity,
                "status": stock.status,
                "date": stock.date,
                "created_at": stock.created_at
            } for stock in farmer_stocks
        ],
        "price_history": [
            {
                "id": price.id,
                "price": price.price,
                "created_by": price.created_by,
                "created_at": price.created_at
            } for price in price_history
        ]
    }

@router.put("/{product_id}", summary="Update product information")
async def update_product(
    product_id: int,
    name: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update product information"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == current_user.shop_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    if name is not None:
        product.name = name
    if category_id is not None:
        product.category_id = category_id
    if status is not None:
        product.status = status
    
    product.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(product)
    
    return {
        "id": product.id,
        "name": product.name,
        "category_id": product.category_id,
        "status": product.status,
        "updated_at": product.updated_at
    }

# Farmer Stock Management Endpoints

@router.post("/stocks", summary="Record farmer delivery/stock entry")
async def record_farmer_stock(
    farmer_user_id: int,
    product_id: int,
    quantity: Decimal,
    delivery_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a new farmer stock delivery"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Verify farmer belongs to same shop
    farmer = db.query(User).filter(
        User.id == farmer_user_id,
        User.shop_id == current_user.shop_id,
        User.role == UserRole.FARMER,
        User.status == RecordStatus.ACTIVE
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found in shop")
    
    # Verify product belongs to shop
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == current_user.shop_id,
        Product.status == RecordStatus.ACTIVE
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in shop")
    
    # Create farmer stock entry
    farmer_stock = FarmerStock(
        shop_id=current_user.shop_id,
        farmer_user_id=farmer_user_id,
        product_id=product_id,
        quantity=quantity,
        date=delivery_date,
        status=StockStatus.ACTIVE
    )
    
    db.add(farmer_stock)
    db.commit()
    db.refresh(farmer_stock)
    
    return {
        "id": farmer_stock.id,
        "farmer_user_id": farmer_stock.farmer_user_id,
        "product_id": farmer_stock.product_id,
        "quantity": farmer_stock.quantity,
        "date": farmer_stock.date,
        "status": farmer_stock.status,
        "created_at": farmer_stock.created_at
    }

@router.get("/stocks", summary="Get farmer stock entries with filters")
async def get_farmer_stocks(
    farmer_user_id: Optional[int] = None,
    product_id: Optional[int] = None,
    status: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get farmer stock entries with filtering options"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    query = db.query(FarmerStock).filter(FarmerStock.shop_id == current_user.shop_id)
    
    if farmer_user_id:
        query = query.filter(FarmerStock.farmer_user_id == farmer_user_id)
    if product_id:
        query = query.filter(FarmerStock.product_id == product_id)
    if status:
        query = query.filter(FarmerStock.status == status)
    if from_date:
        query = query.filter(FarmerStock.date >= from_date)
    if to_date:
        query = query.filter(FarmerStock.date <= to_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    offset = (page - 1) * limit
    stocks = query.order_by(FarmerStock.date.desc()).offset(offset).limit(limit).all()
    
    return {
        "stocks": [
            {
                "id": stock.id,
                "farmer_user_id": stock.farmer_user_id,
                "product_id": stock.product_id,
                "quantity": stock.quantity,
                "date": stock.date,
                "status": stock.status,
                "created_at": stock.created_at,
                "updated_at": stock.updated_at
            } for stock in stocks
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.put("/stocks/{stock_id}", summary="Update farmer stock entry")
async def update_farmer_stock(
    stock_id: int,
    quantity: Optional[Decimal] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update farmer stock entry"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    stock = db.query(FarmerStock).filter(
        FarmerStock.id == stock_id,
        FarmerStock.shop_id == current_user.shop_id
    ).first()
    
    if not stock:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    
    if quantity is not None:
        stock.quantity = quantity
    if status is not None:
        stock.status = status
    
    stock.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(stock)
    
    return {
        "id": stock.id,
        "quantity": stock.quantity,
        "status": stock.status,
        "updated_at": stock.updated_at
    }

# Stock Adjustment Endpoints

@router.post("/adjustments", summary="Create stock adjustment")
async def create_stock_adjustment(
    farmer_stock_id: int,
    adjustment_type: str,
    amount: Decimal,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a stock adjustment for corrections or modifications"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Verify farmer stock belongs to shop
    farmer_stock = db.query(FarmerStock).filter(
        FarmerStock.id == farmer_stock_id,
        FarmerStock.shop_id == current_user.shop_id
    ).first()
    
    if not farmer_stock:
        raise HTTPException(status_code=404, detail="Farmer stock not found")
    
    # Create adjustment
    adjustment = StockAdjustment(
        shop_id=current_user.shop_id,
        farmer_stock_id=farmer_stock_id,
        created_by=current_user.id,
        adjustment_type=adjustment_type,
        amount=amount,
        status=RecordStatus.ACTIVE
    )
    
    db.add(adjustment)
    db.commit()
    db.refresh(adjustment)
    
    return {
        "id": adjustment.id,
        "farmer_stock_id": adjustment.farmer_stock_id,
        "adjustment_type": adjustment.adjustment_type,
        "amount": adjustment.amount,
        "created_by": adjustment.created_by,
        "created_at": adjustment.created_at
    }

@router.get("/adjustments", summary="Get stock adjustments")
async def get_stock_adjustments(
    farmer_stock_id: Optional[int] = None,
    adjustment_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get stock adjustments with filtering"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    query = db.query(StockAdjustment).filter(StockAdjustment.shop_id == current_user.shop_id)
    
    if farmer_stock_id:
        query = query.filter(StockAdjustment.farmer_stock_id == farmer_stock_id)
    if adjustment_type:
        query = query.filter(StockAdjustment.adjustment_type == adjustment_type)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    adjustments = query.order_by(StockAdjustment.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "adjustments": [
            {
                "id": adj.id,
                "farmer_stock_id": adj.farmer_stock_id,
                "adjustment_type": adj.adjustment_type,
                "amount": adj.amount,
                "created_by": adj.created_by,
                "created_at": adj.created_at,
                "status": adj.status
            } for adj in adjustments
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

# Price Management Endpoints

@router.post("/{product_id}/prices", summary="Set product price")
async def set_product_price(
    product_id: int,
    price: Decimal,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set a new price for a product"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Verify product belongs to shop
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == current_user.shop_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create price history entry
    price_history = ProductPriceHistory(
        product_id=product_id,
        created_by=current_user.id,
        price=price,
        status=RecordStatus.ACTIVE
    )
    
    db.add(price_history)
    db.commit()
    db.refresh(price_history)
    
    return {
        "id": price_history.id,
        "product_id": price_history.product_id,
        "price": price_history.price,
        "created_by": price_history.created_by,
        "created_at": price_history.created_at
    }

# Analytics Endpoints

@router.get("/analytics/summary", summary="Get product and stock analytics")
async def get_product_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive product and stock analytics for the shop"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Total products
    total_products = db.query(Product).filter(
        Product.shop_id == current_user.shop_id,
        Product.status == RecordStatus.ACTIVE
    ).count()
    
    # Total active stocks
    total_active_stocks = db.query(FarmerStock).filter(
        FarmerStock.shop_id == current_user.shop_id,
        FarmerStock.status == StockStatus.ACTIVE
    ).count()
    
    # Total stock quantity
    from sqlalchemy import func
    total_quantity = db.query(func.sum(FarmerStock.quantity)).filter(
        FarmerStock.shop_id == current_user.shop_id,
        FarmerStock.status == StockStatus.ACTIVE
    ).scalar() or 0
    
    # Products by category
    products_by_category = db.query(
        Category.name,
        func.count(Product.id).label('count')
    ).join(Product).filter(
        Product.shop_id == current_user.shop_id,
        Product.status == RecordStatus.ACTIVE
    ).group_by(Category.name).all()
    
    # Stock by status
    stock_by_status = db.query(
        FarmerStock.status,
        func.count(FarmerStock.id).label('count')
    ).filter(
        FarmerStock.shop_id == current_user.shop_id
    ).group_by(FarmerStock.status).all()
    
    return {
        "summary": {
            "total_products": total_products,
            "total_active_stocks": total_active_stocks,
            "total_quantity": float(total_quantity)
        },
        "products_by_category": [
            {"category": cat.name, "count": cat.count}
            for cat in products_by_category
        ],
        "stock_by_status": [
            {"status": status.status, "count": status.count}
            for status in stock_by_status
        ]
    }