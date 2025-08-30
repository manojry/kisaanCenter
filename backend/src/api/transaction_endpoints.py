"""
Transaction Management API Endpoints
Core business functionality for sales, purchases, and commission tracking
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import logging
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transactions", tags=["Transactions"])

def success_response(message: str, data: Any = None) -> Dict:
    """Standard success response format"""
    return {
        "success": True,
        "message": message,
        "data": data
    }

@router.post("/")
def create_transaction(
    shop_id: int,
    buyer_id: int,
    transaction_items: str,  # JSON string of items
    commission_rate: float = Query(5.0, ge=0, le=100),
    transaction_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Create a new transaction"""
    try:
        import json
        
        # Parse transaction items
        try:
            items = json.loads(transaction_items)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid transaction_items JSON format")
        
        # Use provided date or current date
        trans_date = date.fromisoformat(transaction_date) if transaction_date else date.today()
        
        # Create transaction
        result = db.execute(text("""
            INSERT INTO transactions (shop_id, buyer_id, type, commission_rate, date, status)
            VALUES (:shop_id, :buyer_id, 'sale', :commission_rate, :date, 'pending')
            RETURNING id, shop_id, buyer_id, commission_rate, date, status
        """), {
            "shop_id": shop_id,
            "buyer_id": buyer_id,
            "commission_rate": commission_rate,
            "date": trans_date
        })
        
        transaction = result.fetchone()
        transaction_id = transaction.id
        
        # Add transaction items
        total_amount = 0.0
        commission_amount = 0.0
        
        for item in items:
            # Insert transaction item
            db.execute(text("""
                INSERT INTO transaction_items (transaction_id, product_id, farmer_id, farmer_stock_id, quantity, price)
                VALUES (:transaction_id, :product_id, :farmer_id, :farmer_stock_id, :quantity, :price)
            """), {
                "transaction_id": transaction_id,
                "product_id": item["product_id"],
                "farmer_id": item["farmer_id"],
                "farmer_stock_id": item.get("farmer_stock_id"),
                "quantity": item["quantity"],
                "price": item["price"]
            })
            
            # Update farmer stock
            if item.get("farmer_stock_id"):
                db.execute(text("""
                    UPDATE farmer_stock 
                    SET quantity = quantity - :quantity
                    WHERE id = :farmer_stock_id
                """), {
                    "quantity": item["quantity"],
                    "farmer_stock_id": item["farmer_stock_id"]
                })
            
            # Calculate totals
            item_total = float(item["quantity"]) * float(item["price"])
            total_amount += item_total
            commission_amount += item_total * (commission_rate / 100)
        
        # Update transaction with calculated amounts
        db.execute(text("""
            UPDATE transactions 
            SET commission_amount = :commission_amount
            WHERE id = :transaction_id
        """), {
            "commission_amount": commission_amount,
            "transaction_id": transaction_id
        })
        
        db.commit()
        
        return success_response("Transaction created successfully", {
            "id": transaction_id,
            "shop_id": transaction.shop_id,
            "buyer_id": transaction.buyer_id,
            "commission_rate": float(transaction.commission_rate),
            "commission_amount": commission_amount,
            "total_amount": total_amount,
            "date": transaction.date.isoformat(),
            "status": transaction.status,
            "items_count": len(items)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating transaction: {e}")
        raise HTTPException(status_code=500, detail="Failed to create transaction")

@router.get("/{transaction_id}")
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get transaction by ID with items"""
    try:
        # Get transaction details
        result = db.execute(text("""
            SELECT t.id, t.shop_id, t.buyer_id, t.type, t.commission_rate, t.commission_amount,
                   t.payment_status, t.buyer_paid_amount, t.farmer_paid_amount, t.date, t.status,
                   u.username as buyer_name, s.name as shop_name
            FROM transactions t
            LEFT JOIN users u ON t.buyer_id = u.id
            LEFT JOIN shops s ON t.shop_id = s.id
            WHERE t.id = :transaction_id
        """), {"transaction_id": transaction_id})
        
        transaction = result.fetchone()
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Get transaction items
        items_result = db.execute(text("""
            SELECT ti.id, ti.product_id, ti.farmer_id, ti.quantity, ti.price,
                   p.name as product_name, u.username as farmer_name
            FROM transaction_items ti
            LEFT JOIN products p ON ti.product_id = p.id
            LEFT JOIN users u ON ti.farmer_id = u.id
            WHERE ti.transaction_id = :transaction_id
        """), {"transaction_id": transaction_id})
        
        items = []
        total_amount = 0.0
        for item in items_result.fetchall():
            item_total = float(item.quantity) * float(item.price)
            total_amount += item_total
            items.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "farmer_id": item.farmer_id,
                "farmer_name": item.farmer_name,
                "quantity": float(item.quantity),
                "price": float(item.price),
                "total": item_total
            })
        
        return success_response("Transaction found", {
            "id": transaction.id,
            "shop_id": transaction.shop_id,
            "shop_name": transaction.shop_name,
            "buyer_id": transaction.buyer_id,
            "buyer_name": transaction.buyer_name,
            "type": transaction.type,
            "commission_rate": float(transaction.commission_rate),
            "commission_amount": float(transaction.commission_amount or 0),
            "total_amount": total_amount,
            "payment_status": transaction.payment_status,
            "buyer_paid_amount": float(transaction.buyer_paid_amount or 0),
            "farmer_paid_amount": float(transaction.farmer_paid_amount or 0),
            "date": transaction.date.isoformat(),
            "status": transaction.status,
            "items": items
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve transaction")

@router.get("/")
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    shop_id: Optional[int] = None,
    buyer_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get transactions with pagination and filters"""
    try:
        offset = (page - 1) * limit
        
        # Build WHERE clause
        where_conditions = []
        params = {"limit": limit, "offset": offset}
        
        if shop_id:
            where_conditions.append("t.shop_id = :shop_id")
            params["shop_id"] = shop_id
        
        if buyer_id:
            where_conditions.append("t.buyer_id = :buyer_id")
            params["buyer_id"] = buyer_id
        
        if status:
            where_conditions.append("t.status = :status")
            params["status"] = status
        
        if date_from:
            where_conditions.append("t.date >= :date_from")
            params["date_from"] = date_from
        
        if date_to:
            where_conditions.append("t.date <= :date_to")
            params["date_to"] = date_to
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Get transactions
        result = db.execute(text(f"""
            SELECT t.id, t.shop_id, t.buyer_id, t.commission_rate, t.commission_amount,
                   t.payment_status, t.date, t.status,
                   u.username as buyer_name, s.name as shop_name
            FROM transactions t
            LEFT JOIN users u ON t.buyer_id = u.id
            LEFT JOIN shops s ON t.shop_id = s.id
            {where_clause}
            ORDER BY t.created_at DESC
            LIMIT :limit OFFSET :offset
        """), params)
        
        transactions = []
        for trans in result.fetchall():
            transactions.append({
                "id": trans.id,
                "shop_id": trans.shop_id,
                "shop_name": trans.shop_name,
                "buyer_id": trans.buyer_id,
                "buyer_name": trans.buyer_name,
                "commission_rate": float(trans.commission_rate),
                "commission_amount": float(trans.commission_amount or 0),
                "payment_status": trans.payment_status,
                "date": trans.date.isoformat(),
                "status": trans.status
            })
        
        # Get total count
        count_result = db.execute(text(f"""
            SELECT COUNT(*) as total FROM transactions t {where_clause}
        """), params)
        total = count_result.fetchone().total
        
        return success_response("Transactions retrieved successfully", {
            "transactions": transactions,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve transactions")

@router.put("/{transaction_id}/confirm-commission")
def confirm_commission(
    transaction_id: int,
    confirmed_by: int = Query(...),
    db: Session = Depends(get_db)
):
    """Confirm commission for a transaction"""
    try:
        result = db.execute(text("""
            UPDATE transactions 
            SET commission_confirmed = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = :transaction_id
            RETURNING id, commission_amount, commission_confirmed
        """), {"transaction_id": transaction_id})
        
        transaction = result.fetchone()
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        db.commit()
        
        return success_response("Commission confirmed successfully", {
            "id": transaction.id,
            "commission_amount": float(transaction.commission_amount or 0),
            "commission_confirmed": transaction.commission_confirmed
        })
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error confirming commission: {e}")
        raise HTTPException(status_code=500, detail="Failed to confirm commission")

@router.get("/shop/{shop_id}/dashboard")
def get_shop_dashboard(shop_id: int, db: Session = Depends(get_db)):
    """Get shop dashboard metrics"""
    try:
        # Get today's transactions
        today_result = db.execute(text("""
            SELECT COUNT(*) as count, COALESCE(SUM(commission_amount), 0) as commission
            FROM transactions 
            WHERE shop_id = :shop_id AND date = CURRENT_DATE
        """), {"shop_id": shop_id})
        today_stats = today_result.fetchone()
        
        # Get this month's transactions
        month_result = db.execute(text("""
            SELECT COUNT(*) as count, COALESCE(SUM(commission_amount), 0) as commission
            FROM transactions 
            WHERE shop_id = :shop_id 
            AND date >= DATE_TRUNC('month', CURRENT_DATE)
        """), {"shop_id": shop_id})
        month_stats = month_result.fetchone()
        
        # Get pending transactions
        pending_result = db.execute(text("""
            SELECT COUNT(*) as count
            FROM transactions 
            WHERE shop_id = :shop_id AND status = 'pending'
        """), {"shop_id": shop_id})
        pending_count = pending_result.fetchone().count
        
        # Get active farmers and buyers
        users_result = db.execute(text("""
            SELECT 
                COUNT(CASE WHEN role = 'farmer' THEN 1 END) as farmers,
                COUNT(CASE WHEN role = 'buyer' THEN 1 END) as buyers
            FROM users 
            WHERE shop_id = :shop_id AND status = 'active'
        """), {"shop_id": shop_id})
        users_stats = users_result.fetchone()
        
        return success_response("Shop dashboard data retrieved", {
            "today": {
                "transactions": today_stats.count,
                "commission": float(today_stats.commission)
            },
            "month": {
                "transactions": month_stats.count,
                "commission": float(month_stats.commission)
            },
            "pending_transactions": pending_count,
            "active_users": {
                "farmers": users_stats.farmers,
                "buyers": users_stats.buyers
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting shop dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard data")

@router.get("/{transaction_id}/summary")
def get_transaction_summary(transaction_id: int, db: Session = Depends(get_db)):
    """Get financial summary for a transaction"""
    try:
        # Get transaction with calculated totals
        result = db.execute(text("""
            SELECT t.id, t.commission_rate, t.commission_amount, t.payment_status,
                   t.buyer_paid_amount, t.farmer_paid_amount,
                   COALESCE(SUM(ti.quantity * ti.price), 0) as total_amount
            FROM transactions t
            LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
            WHERE t.id = :transaction_id
            GROUP BY t.id, t.commission_rate, t.commission_amount, t.payment_status,
                     t.buyer_paid_amount, t.farmer_paid_amount
        """), {"transaction_id": transaction_id})
        
        transaction = result.fetchone()
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        total_amount = float(transaction.total_amount)
        commission_amount = float(transaction.commission_amount or 0)
        farmer_amount = total_amount - commission_amount
        buyer_paid = float(transaction.buyer_paid_amount or 0)
        farmer_paid = float(transaction.farmer_paid_amount or 0)
        
        return success_response("Transaction summary retrieved", {
            "transaction_id": transaction.id,
            "amounts": {
                "total": total_amount,
                "commission": commission_amount,
                "farmer_due": farmer_amount,
                "buyer_paid": buyer_paid,
                "farmer_paid": farmer_paid
            },
            "balances": {
                "buyer_balance": total_amount - buyer_paid,
                "farmer_balance": farmer_amount - farmer_paid,
                "commission_balance": commission_amount
            },
            "payment_status": transaction.payment_status
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve transaction summary")