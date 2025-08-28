"""
Owner Transaction Recording API

This module provides APIs for shop owners to manage sales transactions,
including multi-product sales, farmer linking, payment tracking, and transaction management.

Features:
- Create multi-product sales transactions
- Link products to specific farmers
- Track payment status and commission calculations  
- Transaction history and management
- Transaction completion workflow (three-party model)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel

from ..database import get_db
from ..models import (
    Transaction, TransactionItem, FarmerStock, Product, User, Payment, Credit,
    UserRole, TransactionType, TransactionStatus, PaymentStatus, CompletionStatus,
    PaymentType, RecordStatus, StockStatus
)
from ..services.user_service import UserService, get_current_user

router = APIRouter(prefix="/owner/transactions", tags=["Owner Transaction Management"])

# Request Models
class TransactionItemRequest(BaseModel):
    product_id: int
    farmer_stock_id: int
    quantity: Decimal
    price: Decimal

class CreateTransactionRequest(BaseModel):
    buyer_user_id: int
    transaction_date: date
    items: List[TransactionItemRequest]
    commission_rate: Optional[Decimal] = None
    notes: Optional[str] = None

class PaymentRequest(BaseModel):
    amount: Decimal
    payment_method_id: Optional[int] = None
    payment_type: str = "payment"
    notes: Optional[str] = None

# Transaction Management Endpoints

@router.post("/", summary="Create new multi-product sales transaction")
async def create_transaction(
    request: CreateTransactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new sales transaction with multiple products and farmers"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    if not current_user.shop_id:
        raise HTTPException(status_code=400, detail="User not associated with any shop")
    
    # Verify buyer belongs to same shop
    buyer = db.query(User).filter(
        User.id == request.buyer_user_id,
        User.shop_id == current_user.shop_id,
        User.role == UserRole.BUYER,
        User.status == RecordStatus.ACTIVE
    ).first()
    
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found in shop")
    
    # Validate all transaction items
    for item in request.items:
        # Verify farmer stock exists and belongs to shop
        farmer_stock = db.query(FarmerStock).filter(
            FarmerStock.id == item.farmer_stock_id,
            FarmerStock.shop_id == current_user.shop_id,
            FarmerStock.product_id == item.product_id,
            FarmerStock.status == StockStatus.ACTIVE
        ).first()
        
        if not farmer_stock:
            raise HTTPException(
                status_code=404, 
                detail=f"Farmer stock {item.farmer_stock_id} not found or inactive"
            )
        
        # Check if sufficient quantity is available
        if farmer_stock.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product {item.product_id}. Available: {farmer_stock.quantity}, Requested: {item.quantity}"
            )
    
    # Calculate total amount and commission
    total_amount = sum(item.quantity * item.price for item in request.items)
    commission_rate = request.commission_rate or Decimal('0.05')  # Default 5%
    commission_amount = total_amount * commission_rate
    
    # Create transaction
    transaction = Transaction(
        shop_id=current_user.shop_id,
        buyer_user_id=request.buyer_user_id,
        type=TransactionType.SALE,
        status=TransactionStatus.ACTIVE,
        commission_rate=commission_rate,
        commission_amount=commission_amount,
        payment_status=PaymentStatus.PENDING,
        completion_status=CompletionStatus.PENDING,
        date=request.transaction_date
    )
    
    db.add(transaction)
    db.flush()
    
    # Create transaction items and update farmer stocks
    transaction_items = []
    for item in request.items:
        # Create transaction item
        transaction_item = TransactionItem(
            transaction_id=transaction.id,
            product_id=item.product_id,
            farmer_stock_id=item.farmer_stock_id,
            quantity=item.quantity,
            price=item.price,
            status=RecordStatus.ACTIVE
        )
        
        db.add(transaction_item)
        transaction_items.append(transaction_item)
        
        # Update farmer stock quantity
        farmer_stock = db.query(FarmerStock).filter(
            FarmerStock.id == item.farmer_stock_id
        ).first()
        farmer_stock.quantity -= item.quantity
        farmer_stock.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(transaction)
    
    return {
        "id": transaction.id,
        "buyer_user_id": transaction.buyer_user_id,
        "total_amount": float(total_amount),
        "commission_rate": float(commission_rate),
        "commission_amount": float(commission_amount),
        "payment_status": transaction.payment_status,
        "completion_status": transaction.completion_status,
        "date": transaction.date,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "farmer_stock_id": item.farmer_stock_id,
                "quantity": float(item.quantity),
                "price": float(item.price),
                "total": float(item.quantity * item.price)
            } for item in transaction_items
        ],
        "created_at": transaction.created_at
    }

@router.get("/", summary="Get transactions with filters")
async def get_transactions(
    buyer_user_id: Optional[int] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    completion_status: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transactions with filtering options"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    query = db.query(Transaction).filter(Transaction.shop_id == current_user.shop_id)
    
    if buyer_user_id:
        query = query.filter(Transaction.buyer_user_id == buyer_user_id)
    if status:
        query = query.filter(Transaction.status == status)
    if payment_status:
        query = query.filter(Transaction.payment_status == payment_status)
    if completion_status:
        query = query.filter(Transaction.completion_status == completion_status)
    if from_date:
        query = query.filter(Transaction.date >= from_date)
    if to_date:
        query = query.filter(Transaction.date <= to_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    offset = (page - 1) * limit
    transactions = query.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()
    
    # Enhance with calculated fields
    transaction_data = []
    for trans in transactions:
        # Calculate total amount from items
        total_amount = sum(
            item.quantity * item.price 
            for item in trans.transaction_items
        )
        
        transaction_data.append({
            "id": trans.id,
            "buyer_user_id": trans.buyer_user_id,
            "type": trans.type,
            "status": trans.status,
            "total_amount": float(total_amount),
            "commission_rate": float(trans.commission_rate),
            "commission_amount": float(trans.commission_amount),
            "payment_status": trans.payment_status,
            "completion_status": trans.completion_status,
            "buyer_paid_amount": float(trans.buyer_paid_amount),
            "farmer_paid_amount": float(trans.farmer_paid_amount),
            "commission_confirmed": trans.commission_confirmed,
            "date": trans.date,
            "created_at": trans.created_at,
            "items_count": len(trans.transaction_items)
        })
    
    return {
        "transactions": transaction_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{transaction_id}", summary="Get transaction details")
async def get_transaction_details(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed transaction information including items and payments"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.shop_id == current_user.shop_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Calculate total amount
    total_amount = sum(
        item.quantity * item.price 
        for item in transaction.transaction_items
    )
    
    return {
        "transaction": {
            "id": transaction.id,
            "buyer_user_id": transaction.buyer_user_id,
            "type": transaction.type,
            "status": transaction.status,
            "total_amount": float(total_amount),
            "commission_rate": float(transaction.commission_rate),
            "commission_amount": float(transaction.commission_amount),
            "payment_status": transaction.payment_status,
            "completion_status": transaction.completion_status,
            "buyer_paid_amount": float(transaction.buyer_paid_amount),
            "farmer_paid_amount": float(transaction.farmer_paid_amount),
            "commission_confirmed": transaction.commission_confirmed,
            "date": transaction.date,
            "created_at": transaction.created_at,
            "updated_at": transaction.updated_at
        },
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "farmer_stock_id": item.farmer_stock_id,
                "quantity": float(item.quantity),
                "price": float(item.price),
                "total": float(item.quantity * item.price),
                "status": item.status,
                "created_at": item.created_at
            } for item in transaction.transaction_items
        ],
        "payments": [
            {
                "id": payment.id,
                "amount": float(payment.amount),
                "type": payment.type,
                "status": payment.status,
                "payment_method_id": payment.payment_method_id,
                "date": payment.date,
                "created_at": payment.created_at
            } for payment in transaction.payments
        ]
    }

@router.put("/{transaction_id}/status", summary="Update transaction status")
async def update_transaction_status(
    transaction_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update transaction status"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.shop_id == current_user.shop_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.status = status
    transaction.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(transaction)
    
    return {
        "id": transaction.id,
        "status": transaction.status,
        "updated_at": transaction.updated_at
    }

# Payment Management Endpoints

@router.post("/{transaction_id}/payments", summary="Record payment for transaction")
async def record_payment(
    transaction_id: int,
    request: PaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a payment for a transaction"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.shop_id == current_user.shop_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Create payment record
    payment = Payment(
        transaction_id=transaction_id,
        amount=request.amount,
        payment_method_id=request.payment_method_id,
        type=request.payment_type,
        status=RecordStatus.ACTIVE,
        date=date.today()
    )
    
    db.add(payment)
    
    # Update transaction payment tracking
    if request.payment_type == PaymentType.PAYMENT:
        transaction.buyer_paid_amount += request.amount
        
        # Check if fully paid
        total_amount = sum(
            item.quantity * item.price 
            for item in transaction.transaction_items
        )
        
        if transaction.buyer_paid_amount >= total_amount:
            transaction.payment_status = PaymentStatus.PAID
        elif transaction.buyer_paid_amount > 0:
            transaction.payment_status = PaymentStatus.PARTIAL
    
    transaction.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(payment)
    
    return {
        "id": payment.id,
        "transaction_id": payment.transaction_id,
        "amount": float(payment.amount),
        "type": payment.type,
        "status": payment.status,
        "date": payment.date,
        "created_at": payment.created_at
    }

@router.get("/{transaction_id}/completion-status", summary="Get transaction completion status")
async def get_completion_status(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the completion status of a transaction (three-party model)"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.shop_id == current_user.shop_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Calculate total amounts
    total_amount = sum(
        item.quantity * item.price 
        for item in transaction.transaction_items
    )
    
    farmer_amount = total_amount - transaction.commission_amount
    
    # Calculate completion percentages
    buyer_completion = (transaction.buyer_paid_amount / total_amount * 100) if total_amount > 0 else 0
    farmer_completion = (transaction.farmer_paid_amount / farmer_amount * 100) if farmer_amount > 0 else 0
    
    return {
        "transaction_id": transaction.id,
        "completion_status": transaction.completion_status,
        "amounts": {
            "total_amount": float(total_amount),
            "commission_amount": float(transaction.commission_amount),
            "farmer_amount": float(farmer_amount)
        },
        "buyer_payment": {
            "paid_amount": float(transaction.buyer_paid_amount),
            "remaining_amount": float(total_amount - transaction.buyer_paid_amount),
            "completion_percentage": round(buyer_completion, 2)
        },
        "farmer_payment": {
            "paid_amount": float(transaction.farmer_paid_amount),
            "remaining_amount": float(farmer_amount - transaction.farmer_paid_amount),
            "completion_percentage": round(farmer_completion, 2)
        },
        "commission": {
            "amount": float(transaction.commission_amount),
            "confirmed": transaction.commission_confirmed
        }
    }

@router.post("/{transaction_id}/complete", summary="Mark transaction as complete")
async def complete_transaction(
    transaction_id: int,
    confirm_commission: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a transaction as complete (three-party workflow)"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.shop_id == current_user.shop_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Validate completion conditions
    total_amount = sum(
        item.quantity * item.price 
        for item in transaction.transaction_items
    )
    
    farmer_amount = total_amount - transaction.commission_amount
    
    if transaction.buyer_paid_amount < total_amount:
        raise HTTPException(
            status_code=400, 
            detail="Cannot complete: Buyer payment incomplete"
        )
    
    if transaction.farmer_paid_amount < farmer_amount:
        raise HTTPException(
            status_code=400, 
            detail="Cannot complete: Farmer payment incomplete"
        )
    
    # Mark as complete
    transaction.completion_status = CompletionStatus.COMPLETE
    transaction.commission_confirmed = confirm_commission
    transaction.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(transaction)
    
    return {
        "id": transaction.id,
        "completion_status": transaction.completion_status,
        "commission_confirmed": transaction.commission_confirmed,
        "completed_at": transaction.updated_at
    }

# Analytics Endpoints

@router.get("/analytics/summary", summary="Get transaction analytics")
async def get_transaction_analytics(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive transaction analytics"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Base query
    query = db.query(Transaction).filter(Transaction.shop_id == current_user.shop_id)
    
    if from_date:
        query = query.filter(Transaction.date >= from_date)
    if to_date:
        query = query.filter(Transaction.date <= to_date)
    
    # Total transactions
    total_transactions = query.count()
    
    # Transactions by status
    status_counts = db.query(
        Transaction.status,
        func.count(Transaction.id).label('count')
    ).filter(Transaction.shop_id == current_user.shop_id).group_by(Transaction.status).all()
    
    # Payment status distribution
    payment_status_counts = db.query(
        Transaction.payment_status,
        func.count(Transaction.id).label('count')
    ).filter(Transaction.shop_id == current_user.shop_id).group_by(Transaction.payment_status).all()
    
    # Completion status distribution
    completion_status_counts = db.query(
        Transaction.completion_status,
        func.count(Transaction.id).label('count')
    ).filter(Transaction.shop_id == current_user.shop_id).group_by(Transaction.completion_status).all()
    
    # Revenue analytics
    total_revenue = db.query(func.sum(Transaction.buyer_paid_amount)).filter(
        Transaction.shop_id == current_user.shop_id
    ).scalar() or 0
    
    total_commission = db.query(func.sum(Transaction.commission_amount)).filter(
        Transaction.shop_id == current_user.shop_id,
        Transaction.commission_confirmed == True
    ).scalar() or 0
    
    return {
        "summary": {
            "total_transactions": total_transactions,
            "total_revenue": float(total_revenue),
            "total_commission": float(total_commission)
        },
        "status_distribution": [
            {"status": status.status, "count": status.count}
            for status in status_counts
        ],
        "payment_status_distribution": [
            {"status": status.payment_status, "count": status.count}
            for status in payment_status_counts
        ],
        "completion_status_distribution": [
            {"status": status.completion_status, "count": status.count}
            for status in completion_status_counts
        ]
    }