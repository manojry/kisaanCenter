from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from ..models.transaction import Transaction, TransactionItem
from ....models import RecordStatus, TransactionStatus, CompletionStatus


class TransactionCRUD:
    """CRUD operations for Transaction model with three-party completion logic"""
    
    @staticmethod
    def create(db: Session, transaction_data) -> Transaction:
        """Create a new transaction with items"""
        transaction_dict = transaction_data.model_dump() if hasattr(transaction_data, 'model_dump') else transaction_data
        
        # Extract transaction items if present
        transaction_items_data = transaction_dict.pop('transaction_items', [])
        
        # Set default date if not provided
        if 'date' not in transaction_dict:
            transaction_dict['date'] = date.today()
        
        # Calculate total amount from items
        total_amount = sum(
            float(item.get('quantity', 0)) * float(item.get('price', 0))
            for item in transaction_items_data
        )
        transaction_dict['total_amount'] = total_amount
        
        # Calculate commission amount
        commission_rate = float(transaction_dict.get('commission_rate', 0))
        transaction_dict['commission_amount'] = total_amount * (commission_rate / 100)
        
        # Create transaction
        transaction = Transaction(**transaction_dict)
        db.add(transaction)
        db.flush()  # Get the ID
        
        # Create transaction items
        for item_data in transaction_items_data:
            item_data['transaction_id'] = transaction.id
            transaction_item = TransactionItem(**item_data)
            db.add(transaction_item)
        
        return transaction
    
    @staticmethod
    def get_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
        """Get transaction by ID"""
        return db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.status != TransactionStatus.DELETED
        ).first()
    
    @staticmethod
    def get_with_relations(db: Session, transaction_id: int) -> Optional[Dict]:
        """Get transaction with all relationships"""
        transaction = db.query(Transaction).options(
            joinedload(Transaction.transaction_items),
            joinedload(Transaction.payments),
            joinedload(Transaction.farmer_payments),
            joinedload(Transaction.shop),
            joinedload(Transaction.buyer_user)
        ).filter(
            Transaction.id == transaction_id,
            Transaction.status != TransactionStatus.DELETED
        ).first()
        
        if not transaction:
            return None
        
        return {
            **transaction.to_dict(),
            'items': [item.to_dict() for item in transaction.transaction_items],
            'payments': [payment.to_dict() for payment in transaction.payments] if hasattr(transaction, 'payments') else [],
            'farmer_payments': [fp.to_dict() for fp in transaction.farmer_payments] if hasattr(transaction, 'farmer_payments') else [],
            'shop_name': transaction.shop.name if transaction.shop else None,
            'buyer_name': transaction.buyer_user.username if transaction.buyer_user else None
        }
    
    @staticmethod
    def get_multi(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Dict[str, Any] = None
    ) -> List[Transaction]:
        """Get multiple transactions with optional filters"""
        query = db.query(Transaction).filter(Transaction.status != TransactionStatus.DELETED)
        
        if filters:
            if 'shop_id' in filters:
                query = query.filter(Transaction.shop_id == filters['shop_id'])
            if 'buyer_user_id' in filters:
                query = query.filter(Transaction.buyer_user_id == filters['buyer_user_id'])
            if 'transaction_type' in filters:
                query = query.filter(Transaction.type == filters['transaction_type'])
            if 'status' in filters:
                query = query.filter(Transaction.status == filters['status'])
            if 'completion_status' in filters:
                query = query.filter(Transaction.completion_status == filters['completion_status'])
        
        return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, transaction_id: int, transaction_data) -> Optional[Transaction]:
        """Update transaction"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return None
        
        update_data = transaction_data.model_dump(exclude_unset=True) if hasattr(transaction_data, 'model_dump') else transaction_data
        
        for field, value in update_data.items():
            if field != 'transaction_items':  # Handle items separately
                setattr(transaction, field, value)
        
        # Recalculate amounts if commission rate changed
        if 'commission_rate' in update_data:
            commission_rate = float(update_data['commission_rate'])
            transaction.commission_amount = float(transaction.total_amount) * (commission_rate / 100)
        
        db.flush()
        return transaction
    
    @staticmethod
    def delete(db: Session, transaction_id: int) -> bool:
        """Soft delete transaction by setting status to DELETED"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return False
        
        transaction.status = TransactionStatus.DELETED
        db.flush()
        return True
    
    @staticmethod
    def mark_completed(db: Session, transaction_id: int) -> bool:
        """Mark transaction as completed"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return False
        
        transaction.completion_status = CompletionStatus.COMPLETE
        db.flush()
        return True
    
    @staticmethod
    def update_commission_confirmation(db: Session, transaction_id: int, confirmed: bool) -> bool:
        """Update commission confirmation status"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return False
        
        transaction.commission_confirmed = confirmed
        
        # Auto-update completion status if all criteria are met
        TransactionCRUD._update_completion_status(transaction)
        
        db.flush()
        return True
    
    @staticmethod
    def update_payment_amounts(db: Session, transaction_id: int, buyer_paid: float = None, farmer_paid: float = None) -> bool:
        """Update payment amounts and recalculate completion status"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return False
        
        if buyer_paid is not None:
            transaction.buyer_paid_amount = buyer_paid
        if farmer_paid is not None:
            transaction.farmer_paid_amount = farmer_paid
        
        # Auto-update completion status
        TransactionCRUD._update_completion_status(transaction)
        
        db.flush()
        return True
    
    @staticmethod
    def get_transaction_items(db: Session, transaction_id: int) -> List[Dict]:
        """Get all items for a transaction"""
        items = db.query(TransactionItem).filter(
            TransactionItem.transaction_id == transaction_id,
            TransactionItem.status == RecordStatus.ACTIVE
        ).all()
        
        return [item.to_dict() for item in items]
    
    @staticmethod
    def get_transaction_summary(db: Session, transaction_id: int) -> Optional[Dict]:
        """Get comprehensive transaction summary"""
        transaction = TransactionCRUD.get_with_relations(db, transaction_id)
        if not transaction:
            return None
        
        # Calculate completion percentages
        total_amount = float(transaction['total_amount'])
        commission_amount = float(transaction['commission_amount'])
        farmer_due = total_amount - commission_amount
        
        buyer_paid = float(transaction['buyer_paid_amount'])
        farmer_paid = float(transaction['farmer_paid_amount'])
        
        summary = {
            **transaction,
            'financial_summary': {
                'total_amount': total_amount,
                'commission_amount': commission_amount,
                'farmer_due_amount': farmer_due,
                'buyer_payment_percentage': round((buyer_paid / total_amount) * 100, 1) if total_amount > 0 else 0,
                'farmer_payment_percentage': round((farmer_paid / farmer_due) * 100, 1) if farmer_due > 0 else 0,
                'remaining_buyer_payment': max(0, total_amount - buyer_paid),
                'remaining_farmer_payment': max(0, farmer_due - farmer_paid)
            },
            'item_count': len(transaction.get('items', [])),
            'payment_count': len(transaction.get('payments', [])),
            'farmer_payment_count': len(transaction.get('farmer_payments', []))
        }
        
        return summary
    
    @staticmethod
    def get_transactions_by_shop(db: Session, shop_id: int, limit: int = 100) -> List[Transaction]:
        """Get transactions for a specific shop"""
        return db.query(Transaction).filter(
            Transaction.shop_id == shop_id,
            Transaction.status != TransactionStatus.DELETED
        ).order_by(Transaction.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_transactions_by_buyer(db: Session, buyer_id: int, limit: int = 100) -> List[Transaction]:
        """Get transactions for a specific buyer"""
        return db.query(Transaction).filter(
            Transaction.buyer_user_id == buyer_id,
            Transaction.status != TransactionStatus.DELETED
        ).order_by(Transaction.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def _update_completion_status(transaction: Transaction):
        """Internal method to update completion status based on three-party model"""
        total_amount = float(transaction.total_amount or 0)
        commission_amount = float(transaction.commission_amount or 0)
        farmer_due = total_amount - commission_amount
        
        buyer_complete = (transaction.buyer_paid_amount or 0) >= total_amount
        farmer_complete = (transaction.farmer_paid_amount or 0) >= farmer_due
        commission_confirmed = transaction.commission_confirmed or False
        
        completed_count = sum([buyer_complete, farmer_complete, commission_confirmed])
        
        if completed_count == 3:
            transaction.completion_status = CompletionStatus.COMPLETE
        elif completed_count > 0:
            transaction.completion_status = CompletionStatus.PARTIAL
        else:
            transaction.completion_status = CompletionStatus.PENDING