from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models import Payment, User, Shop, Transaction, PaymentMethod
from ..schemas import PaginationParams
from sqlalchemy import func, desc, asc

class PaymentCRUD:
    """CRUD operations for Payment model"""

    @staticmethod
    def create(db: Session, payment_data) -> Payment:
        """Create a new payment"""
        payment_dict = payment_data.model_dump() if hasattr(payment_data, 'model_dump') else payment_data
        payment = Payment(**payment_dict)
        db.add(payment)
        db.flush()  # Get the ID without committing
        return payment

    @staticmethod
    def get_by_id(db: Session, payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        return db.query(Payment).filter(Payment.id == payment_id).first()

    @staticmethod
    def get_multi(
        db: Session,
        pagination: PaginationParams,
        shop_id: Optional[int] = None,
        user_id: Optional[int] = None,
        transaction_id: Optional[int] = None,
        payment_method_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        status: Optional[str] = None
    ) -> List[Payment]:
        """Get multiple payments with optional filters"""
        query = db.query(Payment)
        if shop_id:
            query = query.join(Transaction).filter(Transaction.shop_id == shop_id)
        if user_id:
            query = query.filter(Payment.processed_by == user_id)
        if transaction_id:
            query = query.filter(Payment.transaction_id == transaction_id)
        if payment_method_id:
            query = query.filter(Payment.payment_method_id == payment_method_id)
        if date_from:
            query = query.filter(Payment.date >= date_from)
        if date_to:
            query = query.filter(Payment.date <= date_to)
        if status:
            query = query.filter(Payment.status == status)
        query = query.order_by(desc(Payment.date))
        if pagination:
            query = query.offset(pagination.offset).limit(pagination.limit)
        return query.all()
