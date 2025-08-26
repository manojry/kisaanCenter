from typing import Optional, List
from sqlalchemy.orm import Session
from ..models import Credit
from ..schemas import CreditCreate, CreditUpdate


class CreditCRUD:
    @staticmethod
    def create(db: Session, credit_data: CreditCreate) -> 'Credit':
        """
        Create a new credit and initialize all required fields. Enforce business rules.
        """
        from ..models import Credit, CreditStatus
        # Business rule: credit amount must be positive
        if credit_data.amount is None or credit_data.amount <= 0:
            raise ValueError("Invalid credit amount")
        # Business rule: enforce credit limits (stub, add logic as needed)
        # TODO: Check user's/shop's credit limit
        credit = Credit(
            amount=credit_data.amount,
            user_id=getattr(credit_data, 'user_id', None),
            shop_id=getattr(credit_data, 'shop_id', None),
            date=credit_data.date,
            status=CreditStatus.PENDING,
        )
        db.add(credit)
        db.flush()  # Get credit.id before commit
        # TODO: Update user's total credit balance if needed
        return credit
    
    @staticmethod
    def get_by_id(db: Session, credit_id: int) -> Optional[Credit]:
        """Get credit by ID"""
        return db.query(Credit).filter(Credit.id == credit_id).first()
    
    @staticmethod
    def get_by_user_id(
        db: Session, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Credit]:
        """Get credits by user ID with pagination"""
        return (
            db.query(Credit)
            .filter(Credit.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def get_by_shop_id(
        db: Session, 
        shop_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Credit]:
        """Get credits by shop ID with pagination"""
        return (
            db.query(Credit)
            .filter(Credit.shop_id == shop_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def update(
        db: Session, 
        credit_id: int, 
        credit_update: CreditUpdate
    ) -> Optional[Credit]:
        """Update credit"""
        # This is a stub implementation
        # In a real implementation, you would handle balance updates carefully
        raise NotImplementedError("Credit update not implemented yet")
    
    @staticmethod
    def delete(db: Session, credit_id: int) -> bool:
        """Delete credit"""
        credit = db.query(Credit).filter(Credit.id == credit_id).first()
        if credit:
            db.delete(credit)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_user_total_credit(db: Session, user_id: int) -> float:
        """Get user's total credit balance"""
        # This would sum all credit amounts for a user
        return 0.0  # Stub implementation
