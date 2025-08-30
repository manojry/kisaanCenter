"""
Stock Management API Endpoints
Farmer stock management and inventory tracking
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Dict, Any
import logging
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/farmer-stock", tags=["Stock Management"])

def success_response(message: str, data: Any = None) -> Dict:
    """Standard success response format"""
    return {
        "success": True,
        "message": message,
        "data": data
    }

@router.get("/")
def get_farmer_stock(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    farmer_id: Optional[int] = None,
    product_id: Optional[int] = None,
    shop_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get farmer stock with pagination and filters"""
    try:
        offset = (page - 1) * limit
        
        # Build WHERE clause
        where_conditions = []
        params = {"limit": limit, "offset": offset}
        
        if farmer_id:
            where_conditions.append("fs.farmer_user_id = :farmer_id")
            params["farmer_id"] = farmer_id
        
        if product_id:
            where_conditions.append("fs.product_id = :product_id")
            params["product_id"] = product_id
        
        if shop_id:
            where_conditions.append("u.shop_id = :shop_id")
            params["shop_id"] = shop_id
        
        if status:
            where_conditions.append("fs.status = :status")
            params["status"] = status
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Get farmer stock
        result = db.execute(text(f"""
            SELECT fs.id, fs.farmer_user_id, fs.product_id, fs.quantity, fs.price, fs.status,
                   u.username as farmer_name, u.contact as farmer_contact,
                   p.name as product_name, p.description as product_description,
                   c.name as category_name,
                   fs.created_at, fs.updated_at
            FROM farmer_stock fs
            LEFT JOIN users u ON fs.farmer_user_id = u.id
            LEFT JOIN products p ON fs.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            {where_clause}
            ORDER BY fs.created_at DESC
            LIMIT :limit OFFSET :offset
        """), params)
        
        stock_items = []
        for item in result.fetchall():
            stock_items.append({
                "id": item.id,
                "farmer_id": item.farmer_user_id,
                "farmer_name": item.farmer_name,
                "farmer_contact": item.farmer_contact,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "product_description": item.product_description,
                "category_name": item.category_name,
                "quantity": float(item.quantity),
                "price": float(item.price),
                "status": item.status,
                "total_value": float(item.quantity) * float(item.price),
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "updated_at": item.updated_at.isoformat() if item.updated_at else None
            })
        
        # Get total count
        count_result = db.execute(text(f"""
            SELECT COUNT(*) as total 
            FROM farmer_stock fs
            LEFT JOIN users u ON fs.farmer_user_id = u.id
            {where_clause}
        """), params)
        total = count_result.fetchone().total
        
        return success_response("Farmer stock retrieved successfully", {
            "stock_items": stock_items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting farmer stock: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve farmer stock")

@router.post("/")
def add_farmer_stock(
    farmer_user_id: int,
    product_id: int,
    quantity: float = Query(..., gt=0),
    price: float = Query(..., gt=0),
    status: str = "in_stock",
    db: Session = Depends(get_db)
):
    """Add new farmer stock entry"""
    try:
        # Verify farmer exists and belongs to a shop
        farmer_result = db.execute(text("""
            SELECT id, username, shop_id FROM users 
            WHERE id = :farmer_id AND role = 'farmer' AND status = 'active'
        """), {"farmer_id": farmer_user_id})
        
        farmer = farmer_result.fetchone()
        if not farmer:
            raise HTTPException(status_code=404, detail="Active farmer not found")
        
        # Verify product exists
        product_result = db.execute(text("""
            SELECT id, name FROM products WHERE id = :product_id AND status = 'active'
        """), {"product_id": product_id})
        
        product = product_result.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Active product not found")
        
        # Check if farmer already has stock for this product
        existing_result = db.execute(text("""
            SELECT id, quantity FROM farmer_stock 
            WHERE farmer_user_id = :farmer_id AND product_id = :product_id 
            AND record_status = 'active'
        """), {"farmer_id": farmer_user_id, "product_id": product_id})
        
        existing = existing_result.fetchone()
        
        if existing:
            # Update existing stock
            new_quantity = float(existing.quantity) + quantity
            result = db.execute(text("""
                UPDATE farmer_stock 
                SET quantity = :new_quantity, price = :price, status = :status, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :stock_id
                RETURNING id, farmer_user_id, product_id, quantity, price, status
            """), {
                "new_quantity": new_quantity,
                "price": price,
                "status": status,
                "stock_id": existing.id
            })
            
            stock = result.fetchone()
            action = "updated"
        else:
            # Create new stock entry
            result = db.execute(text("""
                INSERT INTO farmer_stock (farmer_user_id, product_id, quantity, price, status)
                VALUES (:farmer_id, :product_id, :quantity, :price, :status)
                RETURNING id, farmer_user_id, product_id, quantity, price, status
            """), {
                "farmer_id": farmer_user_id,
                "product_id": product_id,
                "quantity": quantity,
                "price": price,
                "status": status
            })
            
            stock = result.fetchone()
            action = "created"
        
        db.commit()
        
        return success_response(f"Farmer stock {action} successfully", {
            "id": stock.id,
            "farmer_id": stock.farmer_user_id,
            "farmer_name": farmer.username,
            "product_id": stock.product_id,
            "product_name": product.name,
            "quantity": float(stock.quantity),
            "price": float(stock.price),
            "status": stock.status,
            "total_value": float(stock.quantity) * float(stock.price)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding farmer stock: {e}")
        raise HTTPException(status_code=500, detail="Failed to add farmer stock")

@router.put("/{stock_id}")
def update_farmer_stock(
    stock_id: int,
    quantity: Optional[float] = None,
    price: Optional[float] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update farmer stock entry"""
    try:
        # Build SET clause
        set_conditions = []
        params = {"stock_id": stock_id}
        
        if quantity is not None:
            if quantity < 0:
                raise HTTPException(status_code=400, detail="Quantity cannot be negative")
            set_conditions.append("quantity = :quantity")
            params["quantity"] = quantity
        
        if price is not None:
            if price <= 0:
                raise HTTPException(status_code=400, detail="Price must be greater than 0")
            set_conditions.append("price = :price")
            params["price"] = price
        
        if status is not None:
            set_conditions.append("status = :status")
            params["status"] = status
        
        if not set_conditions:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        set_clause = ", ".join(set_conditions)
        
        result = db.execute(text(f"""
            UPDATE farmer_stock 
            SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = :stock_id AND record_status = 'active'
            RETURNING id, farmer_user_id, product_id, quantity, price, status
        """), params)
        
        stock = result.fetchone()
        if not stock:
            raise HTTPException(status_code=404, detail="Stock entry not found")
        
        # Get additional details
        details_result = db.execute(text("""
            SELECT u.username as farmer_name, p.name as product_name
            FROM farmer_stock fs
            LEFT JOIN users u ON fs.farmer_user_id = u.id
            LEFT JOIN products p ON fs.product_id = p.id
            WHERE fs.id = :stock_id
        """), {"stock_id": stock_id})
        
        details = details_result.fetchone()
        
        db.commit()
        
        return success_response("Farmer stock updated successfully", {
            "id": stock.id,
            "farmer_id": stock.farmer_user_id,
            "farmer_name": details.farmer_name if details else None,
            "product_id": stock.product_id,
            "product_name": details.product_name if details else None,
            "quantity": float(stock.quantity),
            "price": float(stock.price),
            "status": stock.status,
            "total_value": float(stock.quantity) * float(stock.price)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating farmer stock: {e}")
        raise HTTPException(status_code=500, detail="Failed to update farmer stock")

@router.get("/status/{shop_id}")
def get_stock_status(shop_id: int, db: Session = Depends(get_db)):
    """Get real-time stock status for a shop"""
    try:
        # Get stock summary by status
        status_result = db.execute(text("""
            SELECT fs.status, COUNT(*) as count, SUM(fs.quantity) as total_quantity,
                   SUM(fs.quantity * fs.price) as total_value
            FROM farmer_stock fs
            LEFT JOIN users u ON fs.farmer_user_id = u.id
            WHERE u.shop_id = :shop_id AND fs.record_status = 'active'
            GROUP BY fs.status
        """), {"shop_id": shop_id})
        
        status_summary = {}
        for row in status_result.fetchall():
            status_summary[row.status] = {
                "count": row.count,
                "total_quantity": float(row.total_quantity or 0),
                "total_value": float(row.total_value or 0)
            }
        
        # Get low stock items (quantity < 10)
        low_stock_result = db.execute(text("""
            SELECT fs.id, fs.quantity, u.username as farmer_name, p.name as product_name
            FROM farmer_stock fs
            LEFT JOIN users u ON fs.farmer_user_id = u.id
            LEFT JOIN products p ON fs.product_id = p.id
            WHERE u.shop_id = :shop_id AND fs.quantity < 10 
            AND fs.record_status = 'active' AND fs.status = 'in_stock'
            ORDER BY fs.quantity ASC
            LIMIT 10
        """), {"shop_id": shop_id})
        
        low_stock_items = []
        for item in low_stock_result.fetchall():
            low_stock_items.append({
                "id": item.id,
                "farmer_name": item.farmer_name,
                "product_name": item.product_name,
                "quantity": float(item.quantity)
            })
        
        # Get top products by value
        top_products_result = db.execute(text("""
            SELECT p.name as product_name, SUM(fs.quantity) as total_quantity,
                   SUM(fs.quantity * fs.price) as total_value
            FROM farmer_stock fs
            LEFT JOIN users u ON fs.farmer_user_id = u.id
            LEFT JOIN products p ON fs.product_id = p.id
            WHERE u.shop_id = :shop_id AND fs.record_status = 'active'
            GROUP BY p.id, p.name
            ORDER BY total_value DESC
            LIMIT 5
        """), {"shop_id": shop_id})
        
        top_products = []
        for product in top_products_result.fetchall():
            top_products.append({
                "product_name": product.product_name,
                "total_quantity": float(product.total_quantity),
                "total_value": float(product.total_value)
            })
        
        return success_response("Stock status retrieved successfully", {
            "status_summary": status_summary,
            "low_stock_items": low_stock_items,
            "top_products": top_products,
            "shop_id": shop_id
        })
        
    except Exception as e:
        logger.error(f"Error getting stock status: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve stock status")

@router.get("/farmer/{farmer_id}")
def get_farmer_stock_summary(farmer_id: int, db: Session = Depends(get_db)):
    """Get stock summary for a specific farmer"""
    try:
        # Verify farmer exists
        farmer_result = db.execute(text("""
            SELECT id, username, shop_id FROM users 
            WHERE id = :farmer_id AND role = 'farmer'
        """), {"farmer_id": farmer_id})
        
        farmer = farmer_result.fetchone()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        # Get farmer's stock summary
        summary_result = db.execute(text("""
            SELECT COUNT(*) as total_items, SUM(quantity) as total_quantity,
                   SUM(quantity * price) as total_value,
                   COUNT(CASE WHEN status = 'in_stock' THEN 1 END) as in_stock_items,
                   COUNT(CASE WHEN status = 'low_stock' THEN 1 END) as low_stock_items,
                   COUNT(CASE WHEN status = 'out_of_stock' THEN 1 END) as out_of_stock_items
            FROM farmer_stock 
            WHERE farmer_user_id = :farmer_id AND record_status = 'active'
        """), {"farmer_id": farmer_id})
        
        summary = summary_result.fetchone()
        
        # Get recent stock items
        recent_result = db.execute(text("""
            SELECT fs.id, fs.quantity, fs.price, fs.status, p.name as product_name,
                   fs.created_at
            FROM farmer_stock fs
            LEFT JOIN products p ON fs.product_id = p.id
            WHERE fs.farmer_user_id = :farmer_id AND fs.record_status = 'active'
            ORDER BY fs.created_at DESC
            LIMIT 5
        """), {"farmer_id": farmer_id})
        
        recent_items = []
        for item in recent_result.fetchall():
            recent_items.append({
                "id": item.id,
                "product_name": item.product_name,
                "quantity": float(item.quantity),
                "price": float(item.price),
                "status": item.status,
                "total_value": float(item.quantity) * float(item.price),
                "created_at": item.created_at.isoformat() if item.created_at else None
            })
        
        return success_response("Farmer stock summary retrieved", {
            "farmer_id": farmer_id,
            "farmer_name": farmer.username,
            "shop_id": farmer.shop_id,
            "summary": {
                "total_items": summary.total_items,
                "total_quantity": float(summary.total_quantity or 0),
                "total_value": float(summary.total_value or 0),
                "in_stock_items": summary.in_stock_items,
                "low_stock_items": summary.low_stock_items,
                "out_of_stock_items": summary.out_of_stock_items
            },
            "recent_items": recent_items
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting farmer stock summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve farmer stock summary")