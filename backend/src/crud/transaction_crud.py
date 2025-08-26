from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models import Transaction
from ..schemas import TransactionCreate, TransactionUpdate


class TransactionCRUD:
    @staticmethod
    def create(db: Session, transaction_data: TransactionCreate) -> 'Transaction':
        """
        Create a new transaction with three-party completion fields initialized.
        """
        from ..models import Transaction, CompletionStatus, PaymentStatus
        # Initialize transaction fields
        transaction = Transaction(
            shop_id=transaction_data.shop_id,
            buyer_user_id=transaction_data.buyer_user_id,
            parent_transaction_id=transaction_data.parent_transaction_id,
            type=transaction_data.transaction_type,
            status=PaymentStatus.PENDING,  # Initial status
            commission_rate=transaction_data.commission_rate,
            commission_amount=0.0,
            payment_status=PaymentStatus.PENDING,
            buyer_paid_amount=0.0,
            farmer_paid_amount=0.0,
            commission_confirmed=False,
            completion_status=CompletionStatus.PENDING,
            date=transaction_data.date,
        )
        db.add(transaction)
        db.flush()  # Get transaction.id before commit
        # TODO: Add transaction items, handle related records, update balances if needed
        return transaction
    
    @staticmethod
    def get_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
        """Get transaction by ID"""
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    @staticmethod
    def get_by_shop_id(
        db: Session, 
        shop_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Transaction]:
        """Get transactions by shop ID with pagination"""
        return (
            db.query(Transaction)
            .filter(Transaction.shop_id == shop_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def get_by_buyer_id(
        db: Session, 
        buyer_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Transaction]:
        """Get transactions by buyer ID with pagination"""
        return (
            db.query(Transaction)
            .filter(Transaction.buyer_id == buyer_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def update(
        db: Session, 
        transaction_id: int, 
        transaction_update: TransactionUpdate
    ) -> Optional[Transaction]:
        """Update transaction"""
        # This is a stub implementation
        # In a real implementation, you would handle status transitions carefully
        raise NotImplementedError("Transaction update not implemented yet")
    
    @staticmethod
    def delete(db: Session, transaction_id: int) -> bool:
        """Delete transaction"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            db.delete(transaction)
            db.commit()
            return True
        return False
    
    @staticmethod
    def count_by_shop(db: Session, shop_id: int) -> int:
        """Count transactions by shop"""
        return db.query(Transaction).filter(Transaction.shop_id == shop_id).count()
