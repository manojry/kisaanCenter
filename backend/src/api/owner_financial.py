"""
Owner Financial Management API

This module provides APIs for shop owners to manage financial operations,
including payment tracking, commission calculations, farmer payouts, and financial reporting.

Features:
- Payment tracking and reconciliation
- Commission calculations and management
- Farmer payout processing
- Credit management for buyers
- Financial reporting and analytics
- Payment method management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel

from ..database import get_db
from ..models import (
    Payment, FarmerPayment, Credit, CreditDetail, Transaction, TransactionItem,
    FarmerStock, User, PaymentMethod, UserRole, PaymentType, FarmerPaymentType,
    PaymentStatus, CreditStatus, RecordStatus
)
from ..services.user_service import UserService, get_current_user

router = APIRouter(prefix="/owner/financial", tags=["Owner Financial Management"])

# Request Models
class FarmerPayoutRequest(BaseModel):
    farmer_user_id: int
    amount: Decimal
    payment_type: str = "settlement"
    payment_method_id: Optional[int] = None
    transaction_id: Optional[int] = None
    farmer_stock_id: Optional[int] = None
    remarks: Optional[str] = None

class CreditRequest(BaseModel):
    buyer_user_id: int
    amount: Decimal
    transaction_id: Optional[int] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None

class PaymentMethodRequest(BaseModel):
    name: str
    description: Optional[str] = None

# Payment Tracking Endpoints

@router.get("/payments", summary="Get all payments with filters")
async def get_payments(
    transaction_id: Optional[int] = None,
    payment_type: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments with filtering options"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Get payments through transactions belonging to the shop
    query = db.query(Payment).join(Transaction).filter(
        Transaction.shop_id == current_user.shop_id
    )
    
    if transaction_id:
        query = query.filter(Payment.transaction_id == transaction_id)
    if payment_type:
        query = query.filter(Payment.type == payment_type)
    if from_date:
        query = query.filter(Payment.date >= from_date)
    if to_date:
        query = query.filter(Payment.date <= to_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    offset = (page - 1) * limit
    payments = query.order_by(Payment.date.desc()).offset(offset).limit(limit).all()
    
    return {
        "payments": [
            {
                "id": payment.id,
                "transaction_id": payment.transaction_id,
                "amount": float(payment.amount),
                "type": payment.type,
                "status": payment.status,
                "payment_method_id": payment.payment_method_id,
                "date": payment.date,
                "created_at": payment.created_at
            } for payment in payments
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/payments/summary", summary="Get payment summary analytics")
async def get_payments_summary(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment summary analytics"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Base query for shop payments
    base_query = db.query(Payment).join(Transaction).filter(
        Transaction.shop_id == current_user.shop_id
    )
    
    if from_date:
        base_query = base_query.filter(Payment.date >= from_date)
    if to_date:
        base_query = base_query.filter(Payment.date <= to_date)
    
    # Total payments received
    total_received = base_query.filter(
        Payment.type == PaymentType.PAYMENT
    ).with_entities(func.sum(Payment.amount)).scalar() or 0
    
    # Total advances received
    total_advances = base_query.filter(
        Payment.type == PaymentType.ADVANCE
    ).with_entities(func.sum(Payment.amount)).scalar() or 0
    
    # Total refunds given
    total_refunds = base_query.filter(
        Payment.type == PaymentType.REFUND
    ).with_entities(func.sum(Payment.amount)).scalar() or 0
    
    # Payment counts by type
    payment_counts = db.query(
        Payment.type,
        func.count(Payment.id).label('count')
    ).join(Transaction).filter(
        Transaction.shop_id == current_user.shop_id
    ).group_by(Payment.type).all()
    
    return {
        "summary": {
            "total_received": float(total_received),
            "total_advances": float(total_advances),
            "total_refunds": float(total_refunds),
            "net_amount": float(total_received + total_advances - total_refunds)
        },
        "payment_counts": [
            {"type": pc.type, "count": pc.count}
            for pc in payment_counts
        ]
    }

# Farmer Payout Management

@router.post("/farmer-payouts", summary="Process farmer payout")
async def process_farmer_payout(
    request: FarmerPayoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a payout to a farmer"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Verify farmer belongs to same shop
    farmer = db.query(User).filter(
        User.id == request.farmer_user_id,
        User.shop_id == current_user.shop_id,
        User.role == UserRole.FARMER,
        User.status == RecordStatus.ACTIVE
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found in shop")
    
    # Verify transaction if provided
    if request.transaction_id:
        transaction = db.query(Transaction).filter(
            Transaction.id == request.transaction_id,
            Transaction.shop_id == current_user.shop_id
        ).first()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify farmer stock if provided
    if request.farmer_stock_id:
        farmer_stock = db.query(FarmerStock).filter(
            FarmerStock.id == request.farmer_stock_id,
            FarmerStock.shop_id == current_user.shop_id,
            FarmerStock.farmer_user_id == request.farmer_user_id
        ).first()
        
        if not farmer_stock:
            raise HTTPException(status_code=404, detail="Farmer stock not found")
    
    # Create farmer payment
    farmer_payment = FarmerPayment(
        transaction_id=request.transaction_id,
        farmer_stock_id=request.farmer_stock_id,
        farmer_user_id=request.farmer_user_id,
        amount=request.amount,
        payment_type=request.payment_type,
        payment_method_id=request.payment_method_id,
        remarks=request.remarks,
        date=date.today()
    )
    
    db.add(farmer_payment)
    
    # Update transaction farmer payment tracking if transaction provided
    if request.transaction_id:
        transaction = db.query(Transaction).filter(
            Transaction.id == request.transaction_id
        ).first()
        transaction.farmer_paid_amount += request.amount
        transaction.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(farmer_payment)
    
    return {
        "id": farmer_payment.id,
        "farmer_user_id": farmer_payment.farmer_user_id,
        "amount": float(farmer_payment.amount),
        "payment_type": farmer_payment.payment_type,
        "transaction_id": farmer_payment.transaction_id,
        "farmer_stock_id": farmer_payment.farmer_stock_id,
        "date": farmer_payment.date,
        "created_at": farmer_payment.created_at
    }

@router.get("/farmer-payouts", summary="Get farmer payouts")
async def get_farmer_payouts(
    farmer_user_id: Optional[int] = None,
    payment_type: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get farmer payouts with filtering"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Get farmer payouts through farmers belonging to the shop
    query = db.query(FarmerPayment).join(User).filter(
        User.shop_id == current_user.shop_id
    )
    
    if farmer_user_id:
        query = query.filter(FarmerPayment.farmer_user_id == farmer_user_id)
    if payment_type:
        query = query.filter(FarmerPayment.payment_type == payment_type)
    if from_date:
        query = query.filter(FarmerPayment.date >= from_date)
    if to_date:
        query = query.filter(FarmerPayment.date <= to_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    offset = (page - 1) * limit
    payouts = query.order_by(FarmerPayment.date.desc()).offset(offset).limit(limit).all()
    
    return {
        "payouts": [
            {
                "id": payout.id,
                "farmer_user_id": payout.farmer_user_id,
                "amount": float(payout.amount),
                "payment_type": payout.payment_type,
                "transaction_id": payout.transaction_id,
                "farmer_stock_id": payout.farmer_stock_id,
                "payment_method_id": payout.payment_method_id,
                "remarks": payout.remarks,
                "date": payout.date,
                "created_at": payout.created_at
            } for payout in payouts
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/farmer-payouts/summary", summary="Get farmer payout summary")
async def get_farmer_payouts_summary(
    farmer_user_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get farmer payout summary analytics"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Base query
    base_query = db.query(FarmerPayment).join(User).filter(
        User.shop_id == current_user.shop_id
    )
    
    if farmer_user_id:
        base_query = base_query.filter(FarmerPayment.farmer_user_id == farmer_user_id)
    if from_date:
        base_query = base_query.filter(FarmerPayment.date >= from_date)
    if to_date:
        base_query = base_query.filter(FarmerPayment.date <= to_date)
    
    # Total payouts by type
    settlement_total = base_query.filter(
        FarmerPayment.payment_type == FarmerPaymentType.SETTLEMENT
    ).with_entities(func.sum(FarmerPayment.amount)).scalar() or 0
    
    advance_total = base_query.filter(
        FarmerPayment.payment_type == FarmerPaymentType.ADVANCE
    ).with_entities(func.sum(FarmerPayment.amount)).scalar() or 0
    
    # Payout counts by farmer
    farmer_payouts = db.query(
        User.username,
        func.sum(FarmerPayment.amount).label('total_amount'),
        func.count(FarmerPayment.id).label('payout_count')
    ).join(FarmerPayment).filter(
        User.shop_id == current_user.shop_id
    ).group_by(User.id, User.username).all()
    
    return {
        "summary": {
            "total_settlements": float(settlement_total),
            "total_advances": float(advance_total),
            "total_payouts": float(settlement_total + advance_total)
        },
        "farmer_payouts": [
            {
                "farmer_username": fp.username,
                "total_amount": float(fp.total_amount),
                "payout_count": fp.payout_count
            } for fp in farmer_payouts
        ]
    }

# Credit Management

@router.post("/credits", summary="Create credit for buyer")
async def create_credit(
    request: CreditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a credit entry for a buyer"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Verify buyer belongs to same shop
    buyer = db.query(User).filter(
        User.id == request.buyer_user_id,
        User.shop_id == current_user.shop_id,
        User.role == UserRole.BUYER,
        User.status == RecordStatus.ACTIVE
    ).first()
    
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found in shop")
    
    # Verify transaction if provided
    if request.transaction_id:
        transaction = db.query(Transaction).filter(
            Transaction.id == request.transaction_id,
            Transaction.shop_id == current_user.shop_id
        ).first()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Create credit
    credit = Credit(
        transaction_id=request.transaction_id,
        buyer_user_id=request.buyer_user_id,
        amount=request.amount,
        status=CreditStatus.OUTSTANDING
    )
    
    db.add(credit)
    db.commit()
    db.refresh(credit)
    
    return {
        "id": credit.id,
        "buyer_user_id": credit.buyer_user_id,
        "amount": float(credit.amount),
        "status": credit.status,
        "transaction_id": credit.transaction_id,
        "created_at": credit.created_at
    }

@router.get("/credits", summary="Get credits with filters")
async def get_credits(
    buyer_user_id: Optional[int] = None,
    status: Optional[str] = None,
    transaction_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get credits with filtering options"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Get credits through buyers belonging to the shop
    query = db.query(Credit).join(User).filter(
        User.shop_id == current_user.shop_id
    )
    
    if buyer_user_id:
        query = query.filter(Credit.buyer_user_id == buyer_user_id)
    if status:
        query = query.filter(Credit.status == status)
    if transaction_id:
        query = query.filter(Credit.transaction_id == transaction_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    offset = (page - 1) * limit
    credits = query.order_by(Credit.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "credits": [
            {
                "id": credit.id,
                "buyer_user_id": credit.buyer_user_id,
                "amount": float(credit.amount),
                "status": credit.status,
                "transaction_id": credit.transaction_id,
                "created_at": credit.created_at,
                "updated_at": credit.updated_at
            } for credit in credits
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.put("/credits/{credit_id}/status", summary="Update credit status")
async def update_credit_status(
    credit_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update credit status"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Get credit through buyer belonging to the shop
    credit = db.query(Credit).join(User).filter(
        Credit.id == credit_id,
        User.shop_id == current_user.shop_id
    ).first()
    
    if not credit:
        raise HTTPException(status_code=404, detail="Credit not found")
    
    credit.status = status
    credit.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(credit)
    
    return {
        "id": credit.id,
        "status": credit.status,
        "updated_at": credit.updated_at
    }

# Commission Management

@router.get("/commissions", summary="Get commission analytics")
async def get_commissions(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get commission analytics and summary"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Base query for shop transactions
    query = db.query(Transaction).filter(Transaction.shop_id == current_user.shop_id)
    
    if from_date:
        query = query.filter(Transaction.date >= from_date)
    if to_date:
        query = query.filter(Transaction.date <= to_date)
    
    # Total commission earned
    total_commission = query.with_entities(
        func.sum(Transaction.commission_amount)
    ).scalar() or 0
    
    # Confirmed commission
    confirmed_commission = query.filter(
        Transaction.commission_confirmed == True
    ).with_entities(
        func.sum(Transaction.commission_amount)
    ).scalar() or 0
    
    # Pending commission
    pending_commission = query.filter(
        Transaction.commission_confirmed == False
    ).with_entities(
        func.sum(Transaction.commission_amount)
    ).scalar() or 0
    
    # Commission by transaction status
    commission_by_status = db.query(
        Transaction.completion_status,
        func.sum(Transaction.commission_amount).label('total_commission'),
        func.count(Transaction.id).label('transaction_count')
    ).filter(
        Transaction.shop_id == current_user.shop_id
    ).group_by(Transaction.completion_status).all()
    
    return {
        "summary": {
            "total_commission": float(total_commission),
            "confirmed_commission": float(confirmed_commission),
            "pending_commission": float(pending_commission)
        },
        "commission_by_status": [
            {
                "status": cbs.completion_status,
                "total_commission": float(cbs.total_commission),
                "transaction_count": cbs.transaction_count
            } for cbs in commission_by_status
        ]
    }

# Payment Methods Management

@router.post("/payment-methods", summary="Create payment method")
async def create_payment_method(
    request: PaymentMethodRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new payment method"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Check if payment method already exists
    existing = db.query(PaymentMethod).filter(
        PaymentMethod.name == request.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Payment method already exists")
    
    # Create payment method
    payment_method = PaymentMethod(
        name=request.name,
        description=request.description,
        is_active=True
    )
    
    db.add(payment_method)
    db.commit()
    db.refresh(payment_method)
    
    return {
        "id": payment_method.id,
        "name": payment_method.name,
        "description": payment_method.description,
        "is_active": payment_method.is_active,
        "created_at": payment_method.created_at
    }

@router.get("/payment-methods", summary="Get payment methods")
async def get_payment_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all available payment methods"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    payment_methods = db.query(PaymentMethod).filter(
        PaymentMethod.is_active == True
    ).all()
    
    return {
        "payment_methods": [
            {
                "id": pm.id,
                "name": pm.name,
                "description": pm.description,
                "is_active": pm.is_active,
                "created_at": pm.created_at
            } for pm in payment_methods
        ]
    }

# Financial Analytics

@router.get("/analytics/dashboard", summary="Get financial dashboard data")
async def get_financial_dashboard(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive financial dashboard data"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Date filtering
    date_filter = []
    if from_date:
        date_filter.append(Transaction.date >= from_date)
    if to_date:
        date_filter.append(Transaction.date <= to_date)
    
    # Revenue metrics
    revenue_query = db.query(Transaction).filter(
        Transaction.shop_id == current_user.shop_id,
        *date_filter
    )
    
    total_sales = revenue_query.with_entities(
        func.sum(Transaction.buyer_paid_amount)
    ).scalar() or 0
    
    total_commission = revenue_query.with_entities(
        func.sum(Transaction.commission_amount)
    ).scalar() or 0
    
    # Farmer payouts
    farmer_payouts = db.query(FarmerPayment).join(User).filter(
        User.shop_id == current_user.shop_id,
        *([FarmerPayment.date >= from_date] if from_date else []),
        *([FarmerPayment.date <= to_date] if to_date else [])
    ).with_entities(
        func.sum(FarmerPayment.amount)
    ).scalar() or 0
    
    # Outstanding credits
    outstanding_credits = db.query(Credit).join(User).filter(
        User.shop_id == current_user.shop_id,
        Credit.status == CreditStatus.OUTSTANDING
    ).with_entities(
        func.sum(Credit.amount)
    ).scalar() or 0
    
    return {
        "revenue": {
            "total_sales": float(total_sales),
            "total_commission": float(total_commission),
            "net_profit": float(total_commission)
        },
        "expenses": {
            "farmer_payouts": float(farmer_payouts)
        },
        "receivables": {
            "outstanding_credits": float(outstanding_credits)
        },
        "cash_flow": {
            "cash_in": float(total_sales),
            "cash_out": float(farmer_payouts),
            "net_cash_flow": float(total_sales - farmer_payouts)
        }
    }