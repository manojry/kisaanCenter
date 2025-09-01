from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from ..models.payment import Payment, FarmerPayment, PaymentMethod
from ....models import RecordStatus, PaymentType, FarmerPaymentType


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
        return db.query(Payment).filter(
            Payment.id == payment_id,
            Payment.status == 'active'
        ).first()
    
    @staticmethod
    def get_with_relations(db: Session, payment_id: int) -> Optional[Dict[str, Any]]:
        """Get payment with all relationships"""
        payment = db.query(Payment).options(
            joinedload(Payment.transaction),
            joinedload(Payment.payment_method),
            joinedload(Payment.credit),
            joinedload(Payment.processed_by_user)
        ).filter(
            Payment.id == payment_id,
            Payment.status == 'active'
        ).first()
        
        if not payment:
            return None
        
        return {
            **payment.to_dict(),
            'transaction_info': payment.transaction.to_dict() if payment.transaction else None,
            'payment_method_name': payment.payment_method.name if payment.payment_method else None,
            'processed_by_name': payment.processed_by_user.username if payment.processed_by_user else None,
            'credit_info': payment.credit.to_dict() if payment.credit else None
        }
    
    @staticmethod
    def get_multi(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Dict[str, Any] = None
    ) -> List[Payment]:
        """Get multiple payments with optional filters"""
        query = db.query(Payment).filter(Payment.status == 'active')
        
        if filters:
            if 'transaction_id' in filters:
                query = query.filter(Payment.transaction_id == filters['transaction_id'])
            if 'payment_method_id' in filters:
                query = query.filter(Payment.payment_method_id == filters['payment_method_id'])
            if 'type' in filters:
                query = query.filter(Payment.type == PaymentType(filters['type']))
            if 'date_from' in filters:
                query = query.filter(Payment.date >= filters['date_from'])
            if 'date_to' in filters:
                query = query.filter(Payment.date <= filters['date_to'])
            if 'status' in filters:
                query = query.filter(Payment.status == RecordStatus(filters['status']))
        
        return query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_transaction(db: Session, transaction_id: int) -> List[Payment]:
        """Get all payments for a specific transaction"""
        return db.query(Payment).filter(
            Payment.transaction_id == transaction_id,
            Payment.status == 'active'
        ).order_by(Payment.created_at.desc()).all()
    
    @staticmethod
    def update(db: Session, payment_id: int, payment_data) -> Optional[Payment]:
        """Update payment"""
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return None
        
        update_data = payment_data.model_dump(exclude_unset=True) if hasattr(payment_data, 'model_dump') else payment_data
        
        for field, value in update_data.items():
            setattr(payment, field, value)
        
        db.flush()
        return payment
    
    @staticmethod
    def delete(db: Session, payment_id: int) -> bool:
        """Soft delete payment by setting status to DELETED"""
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return False
        
        payment.status = RecordStatus.DELETED
        db.flush()
        return True
    
    @staticmethod
    def count_all(db: Session, filters: Dict[str, Any] = None) -> int:
        """Count total payments with optional filters"""
        query = db.query(Payment).filter(Payment.status == 'active')
        
        if filters:
            if 'transaction_id' in filters:
                query = query.filter(Payment.transaction_id == filters['transaction_id'])
            if 'payment_method_id' in filters:
                query = query.filter(Payment.payment_method_id == filters['payment_method_id'])
            if 'type' in filters:
                query = query.filter(Payment.type == PaymentType(filters['type']))
            if 'date_from' in filters:
                query = query.filter(Payment.date >= filters['date_from'])
            if 'date_to' in filters:
                query = query.filter(Payment.date <= filters['date_to'])
        
        return query.count()
    
    @staticmethod
    def get_analytics_summary(
        db: Session, 
        date_from: str = None, 
        date_to: str = None, 
        shop_id: int = None
    ) -> Dict[str, Any]:
        """Get payment analytics summary for a period"""
        query = db.query(Payment).filter(Payment.status == 'active')
        
        # Apply date filters
        if date_from:
            query = query.filter(Payment.date >= date_from)
        if date_to:
            query = query.filter(Payment.date <= date_to)
        
        # Apply shop filter through transaction
        if shop_id:
            from ....models import Transaction
            query = query.join(Transaction).filter(Transaction.shop_id == shop_id)
        
        payments = query.all()
        
        total_amount = sum(float(p.amount or 0) for p in payments)
        payment_count = len(payments)
        
        # Group by payment method
        method_breakdown = {}
        for payment in payments:
            method_name = payment.payment_method.name if payment.payment_method else 'Unknown'
            if method_name not in method_breakdown:
                method_breakdown[method_name] = {'count': 0, 'amount': 0}
            method_breakdown[method_name]['count'] += 1
            method_breakdown[method_name]['amount'] += float(payment.amount or 0)
        
        # Group by payment type
        type_breakdown = {}
        for payment in payments:
            payment_type = payment.type.value if payment.type else 'Unknown'
            if payment_type not in type_breakdown:
                type_breakdown[payment_type] = {'count': 0, 'amount': 0}
            type_breakdown[payment_type]['count'] += 1
            type_breakdown[payment_type]['amount'] += float(payment.amount or 0)
        
        return {
            'period': {
                'from': date_from,
                'to': date_to
            },
            'summary': {
                'total_payments': payment_count,
                'total_amount': total_amount,
                'average_payment': round(total_amount / payment_count, 2) if payment_count > 0 else 0
            },
            'breakdown_by_method': method_breakdown,
            'breakdown_by_type': type_breakdown
        }
    
    @staticmethod
    def advanced_search(db: Session, search_request) -> Dict[str, Any]:
        """Advanced search for payments with complex criteria"""
        query = db.query(Payment).filter(Payment.status == 'active')
        
        # Apply search filters from request
        if hasattr(search_request, 'transaction_id') and search_request.transaction_id:
            query = query.filter(Payment.transaction_id == search_request.transaction_id)
        
        if hasattr(search_request, 'amount_min') and search_request.amount_min:
            query = query.filter(Payment.amount >= search_request.amount_min)
        
        if hasattr(search_request, 'amount_max') and search_request.amount_max:
            query = query.filter(Payment.amount <= search_request.amount_max)
        
        if hasattr(search_request, 'date_from') and search_request.date_from:
            query = query.filter(Payment.date >= search_request.date_from)
        
        if hasattr(search_request, 'date_to') and search_request.date_to:
            query = query.filter(Payment.date <= search_request.date_to)
        
        if hasattr(search_request, 'payment_method_ids') and search_request.payment_method_ids:
            query = query.filter(Payment.payment_method_id.in_(search_request.payment_method_ids))
        
        # Apply pagination
        skip = getattr(search_request, 'skip', 0)
        limit = getattr(search_request, 'limit', 100)
        
        payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
        total = query.count()
        
        return {
            'payments': [payment.to_dict() for payment in payments],
            'total': total,
            'page': (skip // limit) + 1,
            'size': limit
        }


class FarmerPaymentCRUD:
    """CRUD operations for FarmerPayment model"""
    
    @staticmethod
    def create(db: Session, farmer_payment_data) -> FarmerPayment:
        """Create a new farmer payment"""
        payment_dict = farmer_payment_data.model_dump() if hasattr(farmer_payment_data, 'model_dump') else farmer_payment_data
        
        farmer_payment = FarmerPayment(**payment_dict)
        db.add(farmer_payment)
        db.flush()
        return farmer_payment
    
    @staticmethod
    def get_by_id(db: Session, farmer_payment_id: int) -> Optional[FarmerPayment]:
        """Get farmer payment by ID"""
        return db.query(FarmerPayment).filter(
            FarmerPayment.id == farmer_payment_id,
            FarmerPayment.status == 'active'
        ).first()
    
    @staticmethod
    def get_with_relations(db: Session, farmer_payment_id: int) -> Optional[Dict[str, Any]]:
        """Get farmer payment with all relationships"""
        farmer_payment = db.query(FarmerPayment).options(
            joinedload(FarmerPayment.transaction),
            joinedload(FarmerPayment.farmer_user),
            joinedload(FarmerPayment.payment_method),
            joinedload(FarmerPayment.farmer_stock),
            joinedload(FarmerPayment.approved_by_user)
        ).filter(
            FarmerPayment.id == farmer_payment_id,
            FarmerPayment.status == 'active'
        ).first()
        
        if not farmer_payment:
            return None
        
        return {
            **farmer_payment.to_dict(),
            'farmer_name': farmer_payment.farmer_user.username if farmer_payment.farmer_user else None,
            'payment_method_name': farmer_payment.payment_method.name if farmer_payment.payment_method else None,
            'approved_by_name': farmer_payment.approved_by_user.username if farmer_payment.approved_by_user else None,
            'transaction_info': farmer_payment.transaction.to_dict() if farmer_payment.transaction else None
        }
    
    @staticmethod
    def get_multi(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Dict[str, Any] = None
    ) -> List[FarmerPayment]:
        """Get multiple farmer payments with optional filters"""
        query = db.query(FarmerPayment).filter(FarmerPayment.status == 'active')
        
        if filters:
            if 'farmer_id' in filters:
                query = query.filter(FarmerPayment.farmer_user_id == filters['farmer_id'])
            if 'transaction_id' in filters:
                query = query.filter(FarmerPayment.transaction_id == filters['transaction_id'])
            if 'payment_type' in filters:
                query = query.filter(FarmerPayment.payment_type == FarmerPaymentType(filters['payment_type']))
            if 'approved_only' in filters and filters['approved_only']:
                query = query.filter(FarmerPayment.approved_by.isnot(None))
        
        return query.order_by(FarmerPayment.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_transaction(db: Session, transaction_id: int) -> List[FarmerPayment]:
        """Get all farmer payments for a specific transaction"""
        return db.query(FarmerPayment).filter(
            FarmerPayment.transaction_id == transaction_id,
            FarmerPayment.status == 'active'
        ).order_by(FarmerPayment.created_at.desc()).all()
    
    @staticmethod
    def get_by_farmer(db: Session, farmer_id: int, skip: int = 0, limit: int = 100) -> List[FarmerPayment]:
        """Get all farmer payments for a specific farmer"""
        return db.query(FarmerPayment).filter(
            FarmerPayment.farmer_user_id == farmer_id,
            FarmerPayment.status == 'active'
        ).order_by(FarmerPayment.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, farmer_payment_id: int, farmer_payment_data) -> Optional[FarmerPayment]:
        """Update farmer payment"""
        farmer_payment = db.query(FarmerPayment).filter(FarmerPayment.id == farmer_payment_id).first()
        if not farmer_payment:
            return None
        
        update_data = farmer_payment_data.model_dump(exclude_unset=True) if hasattr(farmer_payment_data, 'model_dump') else farmer_payment_data
        
        for field, value in update_data.items():
            setattr(farmer_payment, field, value)
        
        db.flush()
        return farmer_payment
    
    @staticmethod
    def delete(db: Session, farmer_payment_id: int) -> bool:
        """Soft delete farmer payment"""
        farmer_payment = db.query(FarmerPayment).filter(FarmerPayment.id == farmer_payment_id).first()
        if not farmer_payment:
            return False
        
        farmer_payment.status = RecordStatus.DELETED
        db.flush()
        return True
    
    @staticmethod
    def count_all(db: Session, filters: Dict[str, Any] = None) -> int:
        """Count total farmer payments with optional filters"""
        query = db.query(FarmerPayment).filter(FarmerPayment.status == 'active')
        
        if filters:
            if 'farmer_id' in filters:
                query = query.filter(FarmerPayment.farmer_user_id == filters['farmer_id'])
            if 'transaction_id' in filters:
                query = query.filter(FarmerPayment.transaction_id == filters['transaction_id'])
            if 'approved_only' in filters and filters['approved_only']:
                query = query.filter(FarmerPayment.approved_by.isnot(None))
        
        return query.count()
    
    @staticmethod
    def get_pending_approvals(db: Session, skip: int = 0, limit: int = 100) -> List[FarmerPayment]:
        """Get farmer payments pending approval"""
        return db.query(FarmerPayment).filter(
            FarmerPayment.status == 'active',
            FarmerPayment.approved_by.is_(None)
        ).order_by(FarmerPayment.created_at.asc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_farmer_payment_summary(db: Session, farmer_id: int, days: int = 30) -> Dict[str, Any]:
        """Get farmer payment summary for specified period"""
        from datetime import datetime, timedelta
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        payments = db.query(FarmerPayment).filter(
            FarmerPayment.farmer_user_id == farmer_id,
            FarmerPayment.status == 'active',
            FarmerPayment.date >= start_date,
            FarmerPayment.date <= end_date
        ).all()
        
        total_amount = sum(float(fp.amount or 0) for fp in payments)
        approved_payments = [fp for fp in payments if fp.approved_by is not None]
        pending_payments = [fp for fp in payments if fp.approved_by is None]
        
        return {
            'farmer_id': farmer_id,
            'period_days': days,
            'period_start': start_date.isoformat(),
            'period_end': end_date.isoformat(),
            'summary': {
                'total_payments': len(payments),
                'total_amount': total_amount,
                'approved_count': len(approved_payments),
                'approved_amount': sum(float(fp.amount or 0) for fp in approved_payments),
                'pending_count': len(pending_payments),
                'pending_amount': sum(float(fp.amount or 0) for fp in pending_payments)
            }
        }


class PaymentMethodCRUD:
    """CRUD operations for PaymentMethod model"""
    
    @staticmethod
    def create(db: Session, payment_method_data) -> PaymentMethod:
        """Create a new payment method"""
        method_dict = payment_method_data.model_dump() if hasattr(payment_method_data, 'model_dump') else payment_method_data
        
        payment_method = PaymentMethod(**method_dict)
        db.add(payment_method)
        db.flush()
        return payment_method
    
    @staticmethod
    def get_by_id(db: Session, payment_method_id: int) -> Optional[PaymentMethod]:
        """Get payment method by ID"""
        return db.query(PaymentMethod).filter(PaymentMethod.id == payment_method_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[PaymentMethod]:
        """Get payment method by name"""
        return db.query(PaymentMethod).filter(PaymentMethod.name == name).first()
    
    @staticmethod
    def get_all(db: Session, active_only: bool = True) -> List[PaymentMethod]:
        """Get all payment methods"""
        query = db.query(PaymentMethod)
        
        if active_only:
            query = query.filter(PaymentMethod.is_active == True)
        
        return query.order_by(PaymentMethod.name).all()
    
    @staticmethod
    def update(db: Session, payment_method_id: int, payment_method_data) -> Optional[PaymentMethod]:
        """Update payment method"""
        payment_method = db.query(PaymentMethod).filter(PaymentMethod.id == payment_method_id).first()
        if not payment_method:
            return None
        
        update_data = payment_method_data.model_dump(exclude_unset=True) if hasattr(payment_method_data, 'model_dump') else payment_method_data
        
        for field, value in update_data.items():
            setattr(payment_method, field, value)
        
        db.flush()
        return payment_method
    
    @staticmethod
    def delete(db: Session, payment_method_id: int) -> bool:
        """Deactivate payment method"""
        payment_method = db.query(PaymentMethod).filter(PaymentMethod.id == payment_method_id).first()
        if not payment_method:
            return False
        
        payment_method.is_active = False
        db.flush()
        return True