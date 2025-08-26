from typing import Optional, List
from sqlalchemy.orm import Session
from ..models import Payment
from ..schemas import PaymentCreate, PaymentUpdate


class PaymentCRUD:
    @staticmethod
    def create(db: Session, payment_data: PaymentCreate) -> 'Payment':
        """
        Create a new payment and initialize all required fields.
        """
        from ..models import Payment, PaymentStatus
        payment = Payment(
            amount=payment_data.amount,
            payment_method_id=payment_data.payment_method_id,
            payment_type=getattr(payment_data, 'payment_type', 'payment'),
            date=payment_data.date,
            transaction_id=getattr(payment_data, 'transaction_id', None),
            credit_id=getattr(payment_data, 'credit_id', None),
            status=PaymentStatus.PENDING,
        )
        db.add(payment)
        db.flush()  # Get payment.id before commit
        # TODO: Update transaction/credit status if needed
        return payment
    
    @staticmethod
    def get_by_id(db: Session, payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        return db.query(Payment).filter(Payment.id == payment_id).first()
    
    @staticmethod
    def get_by_transaction_id(
        db: Session, 
        transaction_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Payment]:
        """Get payments by transaction ID with pagination"""
        return (
            db.query(Payment)
            .filter(Payment.transaction_id == transaction_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def get_by_payer_id(
        db: Session, 
        payer_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Payment]:
        """Get payments by payer ID with pagination"""
        return (
            db.query(Payment)
            .filter(Payment.payer_id == payer_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def update(
        db: Session, 
        payment_id: int, 
        payment_update: PaymentUpdate
    ) -> Optional[Payment]:
        """Update payment"""
        # This is a stub implementation
        # In a real implementation, you would handle status updates carefully
        raise NotImplementedError("Payment update not implemented yet")
    
    @staticmethod
    def delete(db: Session, payment_id: int) -> bool:
        """Delete payment"""
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if payment:
            db.delete(payment)
            db.commit()
            return True
        return False
    
    @staticmethod
    def count_by_transaction(db: Session, transaction_id: int) -> int:
        """Count payments by transaction"""
        return db.query(Payment).filter(Payment.transaction_id == transaction_id).count()
