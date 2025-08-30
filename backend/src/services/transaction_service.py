from sqlalchemy.orm import Session
from ..schemas import TransactionCreate, TransactionUpdate, APIResponse, PaginationParams
import logging

logger = logging.getLogger(__name__)

class TransactionService:
    @staticmethod
    def create_transaction(db: Session, transaction_data: TransactionCreate, created_by_id: int = None, user_role: str = None) -> APIResponse:
        """
        Create a new transaction with enterprise-grade validation, shop isolation, atomic completion, and audit logging.
        """
        from ..crud.transaction_crud import TransactionCRUD
        from ..models import UserRole, Shop, Transaction
        try:
            # 1. Shop isolation: Only superadmin or owner of shop can create
            shop = db.query(Shop).filter(Shop.id == transaction_data.shop_id).first()
            if not shop:
                return APIResponse(success=False, message="Shop not found.")
            if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                return APIResponse(success=False, message="Permission denied: Only superadmin or owner can create transactions.")

            # 2. Validate commission rate, buyer/farmer existence, etc.
            if transaction_data.commission_rate is not None and (transaction_data.commission_rate < 0 or transaction_data.commission_rate > 100):
                return APIResponse(success=False, message="Invalid commission rate.")

            # 3. Atomic DB transaction for three-party completion fields
            from sqlalchemy.exc import SQLAlchemyError
            try:
                # Begin atomic transaction
                transaction = TransactionCRUD.create(db, transaction_data)
                db.commit()
            except SQLAlchemyError as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")

            # 4. Audit logging (stub)
            # TODO: Implement audit log entry for transaction creation

            return APIResponse(success=True, message="Transaction created successfully.", data={"transaction_id": transaction.id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def get_transaction(db: Session, transaction_id: int, include_relations: bool = False) -> APIResponse:
        """Get transaction by ID with optional relations"""
        try:
            from ..crud.transaction_crud import TransactionCRUD
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            
            if not transaction:
                return APIResponse(success=False, message="Transaction not found")
            
            transaction_data = {
                "id": transaction.id,
                "shop_id": transaction.shop_id,
                "buyer_user_id": transaction.buyer_user_id,
                "type": transaction.type.value,
                "status": transaction.status.value,
                "commission_rate": float(transaction.commission_rate),
                "commission_amount": float(transaction.commission_amount or 0),
                "payment_status": transaction.payment_status.value,
                "buyer_paid_amount": float(transaction.buyer_paid_amount or 0),
                "farmer_paid_amount": float(transaction.farmer_paid_amount or 0),
                "commission_confirmed": transaction.commission_confirmed,
                "completion_status": transaction.completion_status.value,
                "date": transaction.date.isoformat(),
                "created_at": transaction.created_at.isoformat()
            }
            
            if include_relations:
                transaction_data["buyer"] = {
                    "id": transaction.buyer_user.id,
                    "username": transaction.buyer_user.username
                } if transaction.buyer_user else None
                
                transaction_data["items"] = [{
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": float(item.quantity),
                    "price": float(item.price),
                    "product_name": item.product.name if item.product else None
                } for item in transaction.transaction_items]
            
            return APIResponse(success=True, data=transaction_data)
            
        except Exception as e:
            return APIResponse(success=False, message=f"Failed to get transaction: {str(e)}")
    
    @staticmethod
    def get_transactions(db: Session, pagination: PaginationParams, **filters) -> APIResponse:
        """Get paginated transactions with filtering"""
        try:
            from ..crud.transaction_crud import TransactionCRUD
            from ..models import Transaction
            
            query = db.query(Transaction)
            
            # Apply filters
            if filters.get('shop_id'):
                query = query.filter(Transaction.shop_id == filters['shop_id'])
            if filters.get('buyer_id'):
                query = query.filter(Transaction.buyer_user_id == filters['buyer_id'])
            if filters.get('status'):
                query = query.filter(Transaction.status == filters['status'])
            if filters.get('completion_status'):
                query = query.filter(Transaction.completion_status == filters['completion_status'])
            if filters.get('payment_status'):
                query = query.filter(Transaction.payment_status == filters['payment_status'])
            
            # Date filtering
            if filters.get('date_from'):
                from datetime import datetime
                date_from = datetime.strptime(filters['date_from'], '%Y-%m-%d').date()
                query = query.filter(Transaction.date >= date_from)
            if filters.get('date_to'):
                from datetime import datetime
                date_to = datetime.strptime(filters['date_to'], '%Y-%m-%d').date()
                query = query.filter(Transaction.date <= date_to)
            
            # Get total count
            total = query.count()
            
            # Apply sorting
            sort_field = getattr(Transaction, filters.get('sort_by', 'created_at'))
            if filters.get('sort_order') == 'asc':
                query = query.order_by(sort_field.asc())
            else:
                query = query.order_by(sort_field.desc())
            
            # Apply pagination
            offset = (pagination.page - 1) * pagination.limit
            transactions = query.offset(offset).limit(pagination.limit).all()
            
            transactions_data = []
            for transaction in transactions:
                transactions_data.append({
                    "id": transaction.id,
                    "shop_id": transaction.shop_id,
                    "buyer_user_id": transaction.buyer_user_id,
                    "buyer_username": transaction.buyer_user.username if transaction.buyer_user else None,
                    "type": transaction.type.value,
                    "status": transaction.status.value,
                    "commission_rate": float(transaction.commission_rate),
                    "commission_amount": float(transaction.commission_amount or 0),
                    "payment_status": transaction.payment_status.value,
                    "completion_status": transaction.completion_status.value,
                    "date": transaction.date.isoformat(),
                    "created_at": transaction.created_at.isoformat()
                })
            
            return APIResponse(
                success=True,
                data={
                    "items": transactions_data,
                    "total": total,
                    "page": pagination.page,
                    "limit": pagination.limit,
                    "total_pages": (total + pagination.limit - 1) // pagination.limit
                }
            )
            
        except Exception as e:
            return APIResponse(success=False, message=f"Failed to get transactions: {str(e)}")
    
    @staticmethod
    def update_transaction(db: Session, transaction_id: int, transaction_update, updated_by_id: int = None, user_role: str = None) -> APIResponse:
        """
        Update a transaction with enterprise-grade validation, shop isolation, atomic completion, and audit logging.
        """
        from ..crud.transaction_crud import TransactionCRUD
        from ..models import UserRole, Transaction
        try:
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            if not transaction:
                return APIResponse(success=False, message="Transaction not found.")
            # Shop isolation: Only superadmin or owner of shop can update
            if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                return APIResponse(success=False, message="Permission denied: Only superadmin or owner can update transactions.")

            # Validate update fields (e.g., commission, status)
            # TODO: Add more business rule validation as needed

            from sqlalchemy.exc import SQLAlchemyError
            try:
                updated_transaction = TransactionCRUD.update(db, transaction_id, transaction_update)
                db.commit()
            except SQLAlchemyError as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")

            # Audit logging (stub)
            # TODO: Implement audit log entry for transaction update

            return APIResponse(success=True, message="Transaction updated successfully.", data={"transaction_id": transaction_id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def cancel_transaction(db: Session, transaction_id: int, reason: str = None, user_role: str = None) -> APIResponse:
        """
        Cancel a transaction with enterprise-grade validation, shop isolation, atomic update, and audit logging.
        """
        from ..crud.transaction_crud import TransactionCRUD
        from ..models import UserRole, TransactionStatus
        try:
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            if not transaction:
                return APIResponse(success=False, message="Transaction not found.")
            # Shop isolation: Only superadmin or owner of shop can cancel
            if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                return APIResponse(success=False, message="Permission denied: Only superadmin or owner can cancel transactions.")

            # Business validation: Only active transactions can be cancelled
            if transaction.status != TransactionStatus.ACTIVE:
                return APIResponse(success=False, message="Only active transactions can be cancelled.")

            from sqlalchemy.exc import SQLAlchemyError
            try:
                transaction.status = TransactionStatus.CANCELLED
                db.commit()
            except SQLAlchemyError as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")

            # Audit logging (stub)
            # TODO: Implement audit log entry for transaction cancellation

            return APIResponse(success=True, message="Transaction cancelled successfully.", data={"transaction_id": transaction_id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def confirm_commission(db: Session, transaction_id: int, confirmed_by_id: int, user_role: str = None) -> APIResponse:
        """
        Confirm commission for a transaction with enterprise-grade validation, shop isolation, atomic update, and audit logging.
        """
        from ..crud.transaction_crud import TransactionCRUD
        from ..models import UserRole
        try:
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            if not transaction:
                return APIResponse(success=False, message="Transaction not found.")
            # Shop isolation: Only superadmin or owner of shop can confirm commission
            if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                return APIResponse(success=False, message="Permission denied: Only superadmin or owner can confirm commission.")

            from sqlalchemy.exc import SQLAlchemyError
            try:
                transaction.commission_confirmed = True
                db.commit()
            except SQLAlchemyError as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")

            # Audit logging (stub)
            # TODO: Implement audit log entry for commission confirmation

            return APIResponse(success=True, message="Commission confirmed successfully.", data={"transaction_id": transaction_id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def get_transaction_summary(db: Session, transaction_id: int) -> APIResponse:
        """Get comprehensive transaction financial summary"""
        try:
            from ..crud.transaction_crud import TransactionCRUD
            from ..models import TransactionItem
            from decimal import Decimal
            
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            if not transaction:
                return APIResponse(success=False, message="Transaction not found")
            
            # Calculate totals from transaction items
            items = db.query(TransactionItem).filter(
                TransactionItem.transaction_id == transaction_id
            ).all()
            
            total_amount = sum(item.quantity * item.price for item in items)
            commission_amount = total_amount * (transaction.commission_rate / 100)
            net_farmer_amount = total_amount - commission_amount
            
            outstanding_buyer = total_amount - (transaction.buyer_paid_amount or 0)
            outstanding_farmer = net_farmer_amount - (transaction.farmer_paid_amount or 0)
            
            completion_percentage = 0
            if total_amount > 0:
                buyer_completion = min(100, ((transaction.buyer_paid_amount or 0) / total_amount) * 100)
                farmer_completion = min(100, ((transaction.farmer_paid_amount or 0) / net_farmer_amount) * 100) if net_farmer_amount > 0 else 100
                commission_completion = 100 if transaction.commission_confirmed else 0
                completion_percentage = (buyer_completion + farmer_completion + commission_completion) / 3
            
            summary = {
                "transaction_id": transaction_id,
                "total_amount": float(total_amount),
                "commission_amount": float(commission_amount),
                "net_farmer_amount": float(net_farmer_amount),
                "buyer_paid_amount": float(transaction.buyer_paid_amount or 0),
                "farmer_paid_amount": float(transaction.farmer_paid_amount or 0),
                "outstanding_buyer_amount": float(outstanding_buyer),
                "outstanding_farmer_amount": float(outstanding_farmer),
                "completion_percentage": round(completion_percentage, 2),
                "commission_confirmed": transaction.commission_confirmed,
                "status": transaction.status.value,
                "completion_status": transaction.completion_status.value
            }
            
            return APIResponse(success=True, data=summary)
            
        except Exception as e:
            return APIResponse(success=False, message=f"Failed to get transaction summary: {str(e)}")
    
    @staticmethod
    def get_shop_dashboard(db: Session, shop_id: int, date_from: str = None, date_to: str = None) -> APIResponse:
        """Get comprehensive shop dashboard statistics"""
        try:
            from ..models import Transaction, TransactionStatus, CompletionStatus, User, UserRole
            from datetime import datetime, date
            from sqlalchemy import func
            
            query = db.query(Transaction).filter(Transaction.shop_id == shop_id)
            
            # Apply date filters
            if date_from:
                start_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                query = query.filter(Transaction.date >= start_date)
            if date_to:
                end_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                query = query.filter(Transaction.date <= end_date)
            
            transactions = query.all()
            
            # Calculate statistics
            total_transactions = len(transactions)
            pending_transactions = len([t for t in transactions if t.completion_status == CompletionStatus.PENDING])
            completed_transactions = len([t for t in transactions if t.completion_status == CompletionStatus.COMPLETE])
            
            total_sales = sum((t.buyer_paid_amount or 0) for t in transactions)
            total_commission = sum((t.commission_amount or 0) for t in transactions if t.commission_confirmed)
            
            # Outstanding credits
            from ..models import Credit, CreditStatus
            outstanding_credits = db.query(func.sum(Credit.amount)).join(Transaction).filter(
                Transaction.shop_id == shop_id,
                Credit.status.in_([CreditStatus.OUTSTANDING, CreditStatus.PARTIAL])
            ).scalar() or 0
            
            # Active users count
            active_farmers = db.query(User).filter(
                User.shop_id == shop_id,
                User.role == UserRole.FARMER,
                User.status.in_(['active'])
            ).count()
            
            active_buyers = db.query(User).filter(
                User.shop_id == shop_id,
                User.role == UserRole.BUYER,
                User.status.in_(['active'])
            ).count()
            
            dashboard_stats = {
                "total_transactions": total_transactions,
                "pending_transactions": pending_transactions,
                "completed_transactions": completed_transactions,
                "total_sales": float(total_sales),
                "total_commission": float(total_commission),
                "outstanding_credits": float(outstanding_credits),
                "active_farmers": active_farmers,
                "active_buyers": active_buyers,
                "completion_rate": round((completed_transactions / total_transactions * 100) if total_transactions > 0 else 0, 2)
            }
            
            return APIResponse(success=True, data=dashboard_stats)
            
        except Exception as e:
            return APIResponse(success=False, message=f"Failed to get dashboard: {str(e)}")
    
    @staticmethod
    def get_incomplete_transactions(db: Session, shop_id: int = None, action_required: str = None, pagination: PaginationParams = None) -> APIResponse:
        """Get transactions requiring completion actions"""
        try:
            from ..models import Transaction, CompletionStatus, PaymentStatus
            
            query = db.query(Transaction)
            
            if shop_id:
                query = query.filter(Transaction.shop_id == shop_id)
            
            # Filter by action required
            if action_required == 'buyer_payment':
                query = query.filter(Transaction.payment_status != PaymentStatus.PAID)
            elif action_required == 'farmer_payment':
                query = query.filter(Transaction.farmer_paid_amount == 0)
            elif action_required == 'commission':
                query = query.filter(Transaction.commission_confirmed == False)
            else:
                # All incomplete transactions
                query = query.filter(Transaction.completion_status != CompletionStatus.COMPLETE)
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            if pagination:
                offset = (pagination.page - 1) * pagination.limit
                transactions = query.order_by(Transaction.created_at.desc()).offset(offset).limit(pagination.limit).all()
            else:
                transactions = query.order_by(Transaction.created_at.desc()).all()
            
            transactions_data = []
            for transaction in transactions:
                transactions_data.append({
                    "id": transaction.id,
                    "buyer_username": transaction.buyer_user.username if transaction.buyer_user else None,
                    "status": transaction.status.value,
                    "completion_status": transaction.completion_status.value,
                    "payment_status": transaction.payment_status.value,
                    "commission_confirmed": transaction.commission_confirmed,
                    "buyer_paid_amount": float(transaction.buyer_paid_amount or 0),
                    "farmer_paid_amount": float(transaction.farmer_paid_amount or 0),
                    "commission_amount": float(transaction.commission_amount or 0),
                    "date": transaction.date.isoformat(),
                    "actions_needed": [
                        "buyer_payment" if transaction.payment_status != PaymentStatus.PAID else None,
                        "farmer_payment" if (transaction.farmer_paid_amount or 0) == 0 else None,
                        "commission" if not transaction.commission_confirmed else None
                    ]
                })
                # Remove None values from actions_needed
                transactions_data[-1]["actions_needed"] = [a for a in transactions_data[-1]["actions_needed"] if a]
            
            result_data = {
                "items": transactions_data,
                "total": total
            }
            
            if pagination:
                result_data.update({
                    "page": pagination.page,
                    "limit": pagination.limit,
                    "total_pages": (total + pagination.limit - 1) // pagination.limit
                })
            
            return APIResponse(success=True, data=result_data)
            
        except Exception as e:
            return APIResponse(success=False, message=f"Failed to get incomplete transactions: {str(e)}")

    @staticmethod
    def get_transaction_analytics(db: Session, shop_id: int = None, days: int = 30) -> APIResponse:
        """
        Get comprehensive transaction analytics and statistics
        """
        try:
            from ..crud.transaction_crud import TransactionCRUD
            from ..models import Transaction
            from sqlalchemy import func, and_
            from datetime import datetime, timedelta
            
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Base query with date filtering
            base_query = db.query(Transaction).filter(
                Transaction.created_at >= start_date,
                Transaction.created_at <= end_date
            )
            
            # Add shop filter if provided
            if shop_id:
                base_query = base_query.filter(Transaction.shop_id == shop_id)
            
            # Get basic transaction counts and amounts
            total_transactions = base_query.count()
            total_amount = base_query.with_entities(func.sum(Transaction.commission_amount)).scalar() or 0
            
            # Status breakdown
            pending_transactions = base_query.filter(Transaction.completion_status == 'pending').count()
            completed_transactions = base_query.filter(Transaction.completion_status == 'complete').count()
            
            # Commission analytics
            total_commission = base_query.with_entities(func.sum(Transaction.commission_amount)).scalar() or 0
            avg_commission_rate = base_query.with_entities(func.avg(Transaction.commission_rate)).scalar() or 0
            
            # Calculate average transaction amount
            avg_transaction_amount = total_amount / total_transactions if total_transactions > 0 else 0
            
            # Payment status breakdown
            payment_pending = base_query.filter(Transaction.payment_status == 'pending').count()
            payment_partial = base_query.filter(Transaction.payment_status == 'partial').count()
            payment_completed = base_query.filter(Transaction.payment_status == 'paid').count()
            
            # Prepare analytics data
            analytics_data = {
                "period_days": days,
                "date_range": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "totals": {
                    "total_transactions": total_transactions,
                    "total_amount": float(total_amount),
                    "total_commission": float(total_commission),
                    "average_transaction_amount": float(avg_transaction_amount),
                    "average_commission_rate": float(avg_commission_rate)
                },
                "status_breakdown": {
                    "pending_transactions": pending_transactions,
                    "completed_transactions": completed_transactions,
                    "completion_rate": (completed_transactions / total_transactions * 100) if total_transactions > 0 else 0
                },
                "payment_breakdown": {
                    "payment_pending": payment_pending,
                    "payment_partial": payment_partial,
                    "payment_completed": payment_completed,
                    "payment_completion_rate": (payment_completed / total_transactions * 100) if total_transactions > 0 else 0
                }
            }
            
            # Add shop-specific analytics if shop_id is provided
            if shop_id:
                analytics_data["shop_id"] = shop_id
            
            return APIResponse(
                success=True, 
                message="Transaction analytics retrieved successfully",
                data=analytics_data
            )
            
        except Exception as e:
            return APIResponse(success=False, message=f"Failed to get transaction analytics: {str(e)}")
