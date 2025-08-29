from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models import Transaction, TransactionItem, User, Shop, Product
from ..schemas import PaginationParams
from sqlalchemy import func, desc, asc


class TransactionCRUD:
    """CRUD operations for Transaction model"""
    
    @staticmethod
    def create(db: Session, transaction_data) -> Transaction:
        """Create a new transaction"""
        transaction_dict = transaction_data.model_dump() if hasattr(transaction_data, 'model_dump') else transaction_data
        transaction = Transaction(**transaction_dict)
        db.add(transaction)
        db.flush()  # Get the ID without committing
        return transaction
    
    @staticmethod
    def get_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
        """Get transaction by ID"""
        return db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.status != 'deleted'
        ).first()
    
    @staticmethod
    def get_multi(
        db: Session, 
        pagination: PaginationParams, 
        shop_id: Optional[int] = None,
        buyer_user_id: Optional[int] = None,
        transaction_status: Optional[str] = None,
        completion_status: Optional[str] = None,
        payment_status: Optional[str] = None,
        transaction_type: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get multiple transactions with pagination and filters"""
        query = db.query(Transaction).filter(Transaction.status != 'deleted')
        
        # Apply filters
        if shop_id:
            query = query.filter(Transaction.shop_id == shop_id)
        if buyer_user_id:
            query = query.filter(Transaction.buyer_user_id == buyer_user_id)
        if transaction_status:
            query = query.filter(Transaction.status == transaction_status)
        if completion_status:
            query = query.filter(Transaction.completion_status == completion_status)
        if payment_status:
            query = query.filter(Transaction.payment_status == payment_status)
        if transaction_type:
            query = query.filter(Transaction.transaction_type == transaction_type)
        if date_from:
            query = query.filter(Transaction.created_at >= date_from)
        if date_to:
            query = query.filter(Transaction.created_at <= date_to)
        
        # Apply sorting
        sort_field = sort_by if sort_by else 'created_at'
        if hasattr(Transaction, sort_field):
            sort_column = getattr(Transaction, sort_field)
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(Transaction.created_at))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        transactions = query.offset(pagination.offset).limit(pagination.limit).all()
        
        return {
            "items": transactions,
            "total": total,
            "page": pagination.page,
            "per_page": pagination.limit,
            "pages": (total + pagination.limit - 1) // pagination.limit
        }
    
    @staticmethod
    def update(db: Session, transaction_id: int, update_data) -> Optional[Transaction]:
        """Update transaction"""
        transaction = TransactionCRUD.get_by_id(db, transaction_id)
        if not transaction:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True) if hasattr(update_data, 'model_dump') else update_data
        
        for field, value in update_dict.items():
            if hasattr(transaction, field):
                setattr(transaction, field, value)
        
        transaction.updated_at = datetime.utcnow()
        db.flush()
        return transaction
    
    @staticmethod
    def delete(db: Session, transaction_id: int) -> bool:
        """Soft delete transaction"""
        transaction = TransactionCRUD.get_by_id(db, transaction_id)
        if not transaction:
            return False
        
        transaction.status = 'deleted'
        transaction.updated_at = datetime.utcnow()
        db.flush()
        return True
    
    @staticmethod
    def get_summary_stats(db: Session, shop_id: Optional[int] = None) -> Dict[str, Any]:
        """Get transaction summary statistics"""
        query = db.query(Transaction).filter(Transaction.status != 'deleted')
        
        if shop_id:
            query = query.filter(Transaction.shop_id == shop_id)
        
        total_count = query.count()
        total_amount = query.with_entities(func.sum(Transaction.total_amount)).scalar() or 0
        
        # Count by status
        status_counts = {}
        for status_row in query.with_entities(Transaction.status, func.count(Transaction.id)).group_by(Transaction.status).all():
            status_counts[status_row[0]] = status_row[1]
        
        return {
            "total_transactions": total_count,
            "total_amount": float(total_amount),
            "status_breakdown": status_counts
        }
