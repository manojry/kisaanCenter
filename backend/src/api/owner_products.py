"""
Owner Product Management API
Allows owners to select and manage products for their shop
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from ..database import get_db
from ..schemas import APIResponse

router = APIRouter(prefix="/owner/products", tags=["Owner Products"])

@router.get("/available", response_model=APIResponse)
def get_available_products(
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all available products that can be assigned to shop"""
    try:
        query = "SELECT id, name, category_id, price FROM products WHERE record_status = 'active'"
        params = {}
        
        if category_id:
            query += " AND category_id = :category_id"
            params["category_id"] = category_id
        
        result = db.execute(text(query), params)
        products = [
            {
                "id": row[0],
                "name": row[1], 
                "category_id": row[2],
                "price": float(row[3]) if row[3] else None
            }
            for row in result.fetchall()
        ]
        
        return APIResponse(
            success=True,
            message="Available products retrieved",
            data=products
        )
    except Exception as e:
        return APIResponse(success=False, message=f"Error retrieving products: {str(e)}")

@router.get("/shop/{shop_id}", response_model=APIResponse)  
def get_shop_products(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get products currently assigned to a shop"""
    try:
        result = db.execute(text("""
            SELECT p.id, p.name, p.category_id, p.price, sp.is_active
            FROM products p
            JOIN shop_products sp ON p.id = sp.product_id
            WHERE sp.shop_id = :shop_id AND sp.is_active = true
            ORDER BY p.name
        """), {"shop_id": shop_id})
        
        products = [
            {
                "id": row[0],
                "name": row[1],
                "category_id": row[2], 
                "price": float(row[3]) if row[3] else None,
                "is_active": row[4]
            }
            for row in result.fetchall()
        ]
        
        return APIResponse(
            success=True,
            message=f"Shop {shop_id} products retrieved",
            data=products
        )
    except Exception as e:
        return APIResponse(success=False, message=f"Error retrieving shop products: {str(e)}")

@router.post("/shop/{shop_id}/assign", response_model=APIResponse)
def assign_products_to_shop(
    shop_id: int,
    product_ids: List[int],
    current_user_id: Optional[int] = None,  # In real app, from JWT
    db: Session = Depends(get_db)
):
    """Owner assigns products to their shop"""
    try:
        # Validate owner can only manage their shop
        if current_user_id:
            user_check = db.execute(text("""
                SELECT role, shop_id FROM users WHERE id = :user_id
            """), {"user_id": current_user_id}).fetchone()
            
            if user_check and user_check[0] == 'owner' and user_check[1] != shop_id:
                return APIResponse(success=False, message="You can only manage products for your own shop")
        
        # Remove existing assignments
        db.execute(text("""
            UPDATE shop_products SET is_active = false 
            WHERE shop_id = :shop_id
        """), {"shop_id": shop_id})
        
        # Add new assignments
        assigned_count = 0
        for product_id in product_ids:
            # Check if mapping already exists
            existing = db.execute(text("""
                SELECT id FROM shop_products 
                WHERE shop_id = :shop_id AND product_id = :product_id
            """), {"shop_id": shop_id, "product_id": product_id}).fetchone()
            
            if existing:
                # Reactivate existing mapping
                db.execute(text("""
                    UPDATE shop_products SET is_active = true
                    WHERE shop_id = :shop_id AND product_id = :product_id
                """), {"shop_id": shop_id, "product_id": product_id})
            else:
                # Create new mapping
                db.execute(text("""
                    INSERT INTO shop_products (shop_id, product_id, is_active)
                    VALUES (:shop_id, :product_id, true)
                """), {"shop_id": shop_id, "product_id": product_id})
            
            assigned_count += 1
        
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Assigned {assigned_count} products to shop {shop_id}",
            data={"shop_id": shop_id, "assigned_products": assigned_count}
        )
        
    except Exception as e:
        db.rollback()
        return APIResponse(success=False, message=f"Error assigning products: {str(e)}")

@router.delete("/shop/{shop_id}/products/{product_id}", response_model=APIResponse)
def remove_product_from_shop(
    shop_id: int,
    product_id: int,
    current_user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Owner removes a product from their shop"""
    try:
        # Validate ownership
        if current_user_id:
            user_check = db.execute(text("""
                SELECT role, shop_id FROM users WHERE id = :user_id
            """), {"user_id": current_user_id}).fetchone()
            
            if user_check and user_check[0] == 'owner' and user_check[1] != shop_id:
                return APIResponse(success=False, message="You can only manage products for your own shop")
        
        # Deactivate the product assignment
        result = db.execute(text("""
            UPDATE shop_products 
            SET is_active = false
            WHERE shop_id = :shop_id AND product_id = :product_id
            RETURNING id
        """), {"shop_id": shop_id, "product_id": product_id})
        
        if result.fetchone():
            db.commit()
            return APIResponse(
                success=True,
                message=f"Product {product_id} removed from shop {shop_id}"
            )
        else:
            return APIResponse(
                success=False,
                message="Product not found in shop or already inactive"
            )
            
    except Exception as e:
        db.rollback()
        return APIResponse(success=False, message=f"Error removing product: {str(e)}")

@router.get("/categories", response_model=APIResponse)
def get_product_categories(db: Session = Depends(get_db)):
    """Get all product categories for filtering"""
    try:
        result = db.execute(text("""
            SELECT id, name, description 
            FROM categories 
            WHERE record_status = 'active'
            ORDER BY name
        """))
        
        categories = [
            {
                "id": row[0],
                "name": row[1],
                "description": row[2]
            }
            for row in result.fetchall()
        ]
        
        return APIResponse(
            success=True,
            message="Product categories retrieved",
            data=categories
        )
    except Exception as e:
        return APIResponse(success=False, message=f"Error retrieving categories: {str(e)}")
