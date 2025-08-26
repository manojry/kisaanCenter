from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from ..models import (
    Transaction, TransactionItem, TransactionType, TransactionStatus,
    CompletionStatus, PaymentStatus, RecordStatus, User, Product, FarmerStock
)
from ..schemas import TransactionCreate, TransactionUpdate

class TransactionCRUD:
    @staticmethod
    def create(db: Session, transaction_data: TransactionCreate) -> Transaction:
        """Create a new transaction with items"""
        try:
            # Create main transaction
            transaction = Transaction(
                shop_id=transaction_data.shop_id,
                buyer_user_id=transaction_data.buyer_user_id,
                parent_transaction_id=transaction_data.parent_transaction_id,
                type=transaction_data.transaction_type,
                status=TransactionStatus.ACTIVE,
                commission_rate=transaction_data.commission_rate,
                payment_status=PaymentStatus.PENDING,
                buyer_paid_amount=Decimal('0.00'),
                farmer_paid_amount=Decimal('0.00'),
                commission_confirmed=False,
                completion_status=CompletionStatus.PENDING,
                date=date.today()
            )
            
            db.add(transaction)
            db.flush()  # Get transaction ID
            
            # Calculate total amount and commission
            total_amount = Decimal('0.00')
            
            # Create transaction items
            for item_data in transaction_data.transaction_items:
                # Validate stock availability
                if item_data.farmer_stock_id:
                    stock = db.query(FarmerStock).filter(
                        FarmerStock.id == item_data.farmer_stock_id
                    ).first()
                    
                    if not stock or stock.quantity < item_data.quantity:
                        raise ValueError(f"Insufficient stock for product {item_data.product_id}")
                    
                    # Update stock quantity
                    stock.quantity -= item_data.quantity
                
                # Create transaction item
                transaction_item = TransactionItem(
                    transaction_id=transaction.id,
                    product_id=item_data.product_id,
                    farmer_stock_id=item_data.farmer_stock_id,
                    quantity=item_data.quantity,
                    price=item_data.price,
                    status=RecordStatus.ACTIVE
                )
                
                db.add(transaction_item)
                total_amount += item_data.quantity * item_data.price
            
            # Calculate and set commission amount
            commission_amount = total_amount * (transaction.commission_rate / 100)
            transaction.commission_amount = commission_amount
            
            db.flush()
            return transaction
            
        except Exception as e:
            db.rollback()
            raise e
    
    @staticmethod
    def get_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
        """Get transaction by ID"""
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    @staticmethod
    def get_by_shop(db: Session, shop_id: int, limit: int = 100) -> List[Transaction]:
        """Get transactions by shop ID"""
        return db.query(Transaction).filter(
            Transaction.shop_id == shop_id
        ).order_by(Transaction.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_by_buyer(db: Session, buyer_id: int, limit: int = 100) -> List[Transaction]:
        """Get transactions by buyer ID"""
        return db.query(Transaction).filter(
            Transaction.buyer_user_id == buyer_id
        ).order_by(Transaction.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def update(db: Session, transaction_id: int, transaction_update: TransactionUpdate) -> Optional[Transaction]:
        """Update transaction"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            update_data = transaction_update.model_dump(exclude_unset=True)
            
            for field, value in update_data.items():
                if field == 'commission_rate' and value is not None:
                    # Recalculate commission amount
                    setattr(transaction, field, value)
                    # Recalculate commission based on transaction items
                    items = db.query(TransactionItem).filter(
                        TransactionItem.transaction_id == transaction_id
                    ).all()
                    total_amount = sum(item.quantity * item.price for item in items)
                    transaction.commission_amount = total_amount * (value / 100)
                else:
                    setattr(transaction, field, value)
            
            # Update completion status based on payments
            TransactionCRUD._update_completion_status(db, transaction)
            db.flush()
        
        return transaction
    
    @staticmethod
    def update_buyer_payment(db: Session, transaction_id: int, amount: Decimal) -> Optional[Transaction]:
        """Update buyer payment amount"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            transaction.buyer_paid_amount = (transaction.buyer_paid_amount or 0) + amount
            
            # Update payment status
            items = db.query(TransactionItem).filter(
                TransactionItem.transaction_id == transaction_id
            ).all()
            total_amount = sum(item.quantity * item.price for item in items)
            
            if transaction.buyer_paid_amount >= total_amount:
                transaction.payment_status = PaymentStatus.PAID
            elif transaction.buyer_paid_amount > 0:
                transaction.payment_status = PaymentStatus.PARTIAL
            
            TransactionCRUD._update_completion_status(db, transaction)
            db.flush()
        
        return transaction
    
    @staticmethod
    def update_farmer_payment(db: Session, transaction_id: int, amount: Decimal) -> Optional[Transaction]:
        """Update farmer payment amount"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            transaction.farmer_paid_amount = (transaction.farmer_paid_amount or 0) + amount
            TransactionCRUD._update_completion_status(db, transaction)
            db.flush()
        
        return transaction
    
    @staticmethod
    def confirm_commission(db: Session, transaction_id: int) -> Optional[Transaction]:
        """Confirm commission for transaction"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            transaction.commission_confirmed = True
            TransactionCRUD._update_completion_status(db, transaction)
            db.flush()
        
        return transaction
    
    @staticmethod
    def cancel_transaction(db: Session, transaction_id: int) -> Optional[Transaction]:
        """Cancel transaction and restore stock"""
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            # Restore stock quantities
            items = db.query(TransactionItem).filter(
                TransactionItem.transaction_id == transaction_id
            ).all()
            
            for item in items:
                if item.farmer_stock_id:
                    stock = db.query(FarmerStock).filter(
                        FarmerStock.id == item.farmer_stock_id
                    ).first()
                    if stock:
                        stock.quantity += item.quantity
            
            transaction.status = TransactionStatus.CANCELLED
            db.flush()
        
        return transaction
    
    @staticmethod
    def _update_completion_status(db: Session, transaction: Transaction):
        """Update transaction completion status based on payments and commission"""
        # Get total amount from items
        items = db.query(TransactionItem).filter(
            TransactionItem.transaction_id == transaction.id
        ).all()
        total_amount = sum(item.quantity * item.price for item in items)
        
        if total_amount == 0:
            return
        
        commission_amount = transaction.commission_amount or 0
        net_farmer_amount = total_amount - commission_amount
        
        buyer_paid = transaction.buyer_paid_amount or 0
        farmer_paid = transaction.farmer_paid_amount or 0
        
        # Check completion criteria
        buyer_complete = buyer_paid >= total_amount
        farmer_complete = farmer_paid >= net_farmer_amount if net_farmer_amount > 0 else True
        commission_complete = transaction.commission_confirmed
        
        if buyer_complete and farmer_complete and commission_complete:
            transaction.completion_status = CompletionStatus.COMPLETE
        elif buyer_paid > 0 or farmer_paid > 0 or commission_complete:
            transaction.completion_status = CompletionStatus.PARTIAL
        else:
            transaction.completion_status = CompletionStatus.PENDING
    
    @staticmethod
    def get_incomplete_transactions(db: Session, shop_id: Optional[int] = None) -> List[Transaction]:
        """Get transactions that are not fully completed"""
        query = db.query(Transaction).filter(
            Transaction.completion_status != CompletionStatus.COMPLETE,
            Transaction.status == TransactionStatus.ACTIVE
        )
        
        if shop_id:
            query = query.filter(Transaction.shop_id == shop_id)
        
        return query.order_by(Transaction.created_at.desc()).all()
    
    @staticmethod
    def get_transactions_by_date_range(db: Session, shop_id: int, start_date: date, end_date: date) -> List[Transaction]:
        """Get transactions within date range"""
        return db.query(Transaction).filter(
            and_(
                Transaction.shop_id == shop_id,
                Transaction.date >= start_date,
                Transaction.date <= end_date
            )
        ).order_by(Transaction.date.desc()).all()
    
    @staticmethod
    def get_transaction_statistics(db: Session, shop_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> dict:
        """Get transaction statistics for dashboard"""
        query = db.query(Transaction).filter(Transaction.shop_id == shop_id)
        
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        
        transactions = query.all()
        
        total_count = len(transactions)
        active_count = len([t for t in transactions if t.status == TransactionStatus.ACTIVE])
        completed_count = len([t for t in transactions if t.completion_status == CompletionStatus.COMPLETE])
        
        total_sales = sum((t.buyer_paid_amount or 0) for t in transactions)
        total_commission = sum((t.commission_amount or 0) for t in transactions if t.commission_confirmed)
        
        return {
            "total_transactions": total_count,
            "active_transactions": active_count,
            "completed_transactions": completed_count,
            "total_sales": float(total_sales),
            "total_commission": float(total_commission),
            "completion_rate": (completed_count / total_count * 100) if total_count > 0 else 0
        }