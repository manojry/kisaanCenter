from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from ..models.payment import Payment, FarmerPayment, PaymentMethod
from ..crud.payment_crud import PaymentCRUD, FarmerPaymentCRUD, PaymentMethodCRUD
from ....models import RecordStatus, PaymentType, FarmerPaymentType


class PaymentService:
    """Business logic service for payment operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.payment_crud = PaymentCRUD()
        self.farmer_payment_crud = FarmerPaymentCRUD()
        self.payment_method_crud = PaymentMethodCRUD()
    
    def create_payment(self, payment_data) -> Dict[str, Any]:
        """
        Create a new buyer payment with full business validation
        
        Business Rules:
        - Transaction must exist and be active
        - Payment amount must be positive
        - Cannot exceed remaining transaction amount
        - Updates transaction buyer_paid_amount
        - Recalculates transaction completion status
        """
        try:
            # Validate transaction exists
            from ....models import Transaction
            transaction = self.db.query(Transaction).filter(
                Transaction.id == payment_data.transaction_id,
                Transaction.status == RecordStatus.ACTIVE
            ).first()
            
            if not transaction:
                raise ValueError(f"Transaction {payment_data.transaction_id} not found or inactive")
            
            # Validate payment amount
            if payment_data.amount <= 0:
                raise ValueError("Payment amount must be positive")
            
            # Check if payment would exceed transaction total
            current_paid = float(transaction.buyer_paid_amount or 0)
            new_total = current_paid + float(payment_data.amount)
            transaction_total = float(transaction.total_amount or 0)
            
            if new_total > transaction_total:
                raise ValueError(
                    f"Payment amount would exceed transaction total. "
                    f"Remaining: ₹{transaction_total - current_paid:.2f}"
                )
            
            # Validate payment method exists
            payment_method = self.payment_method_crud.get_by_id(self.db, payment_data.payment_method_id)
            if not payment_method or not payment_method.is_active:
                raise ValueError("Invalid or inactive payment method")
            
            # Create payment
            payment = self.payment_crud.create(self.db, payment_data)
            
            # Update transaction buyer payment amount
            transaction.buyer_paid_amount = new_total
            
            # Recalculate completion status
            self._update_transaction_completion_status(transaction)
            
            self.db.commit()
            
            # Return payment with additional info
            return self._format_payment_response(payment)
            
        except ValueError as e:
            self.db.rollback()
            raise e
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to create payment: {str(e)}")
    
    def create_farmer_payment(self, farmer_payment_data) -> Dict[str, Any]:
        """
        Create a farmer payment with validation
        
        Business Rules:
        - Farmer user must exist and be active
        - Transaction must exist
        - Payment amount must be positive
        - Updates transaction farmer_paid_amount
        - Requires approval for processing
        """
        try:
            # Validate farmer user exists
            from ....models import User, UserRole
            farmer = self.db.query(User).filter(
                User.id == farmer_payment_data.farmer_user_id,
                User.role == UserRole.FARMER,
                User.status == RecordStatus.ACTIVE
            ).first()
            
            if not farmer:
                raise ValueError(f"Farmer user {farmer_payment_data.farmer_user_id} not found or inactive")
            
            # Validate transaction
            from ....models import Transaction
            transaction = self.db.query(Transaction).filter(
                Transaction.id == farmer_payment_data.transaction_id,
                Transaction.status == RecordStatus.ACTIVE
            ).first()
            
            if not transaction:
                raise ValueError(f"Transaction {farmer_payment_data.transaction_id} not found or inactive")
            
            # Validate payment amount
            if farmer_payment_data.amount <= 0:
                raise ValueError("Payment amount must be positive")
            
            # Check if payment would exceed farmer due amount
            commission_amount = float(transaction.commission_amount or 0)
            farmer_due = float(transaction.total_amount or 0) - commission_amount
            current_paid = float(transaction.farmer_paid_amount or 0)
            new_total = current_paid + float(farmer_payment_data.amount)
            
            if new_total > farmer_due:
                raise ValueError(
                    f"Payment amount would exceed farmer due amount. "
                    f"Remaining: ₹{farmer_due - current_paid:.2f}"
                )
            
            # Create farmer payment
            farmer_payment = self.farmer_payment_crud.create(self.db, farmer_payment_data)
            
            # Update transaction farmer payment amount
            transaction.farmer_paid_amount = new_total
            
            # Recalculate completion status
            self._update_transaction_completion_status(transaction)
            
            self.db.commit()
            
            return self._format_farmer_payment_response(farmer_payment)
            
        except ValueError as e:
            self.db.rollback()
            raise e
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to create farmer payment: {str(e)}")
    
    def get_payment_by_id(self, payment_id: int) -> Optional[Dict[str, Any]]:
        """Get payment by ID with related information"""
        payment = self.payment_crud.get_with_relations(self.db, payment_id)
        if not payment:
            return None
        return payment
    
    def get_farmer_payment_by_id(self, farmer_payment_id: int) -> Optional[Dict[str, Any]]:
        """Get farmer payment by ID with related information"""
        farmer_payment = self.farmer_payment_crud.get_with_relations(self.db, farmer_payment_id)
        if not farmer_payment:
            return None
        return farmer_payment
    
    def get_payments(self, skip: int = 0, limit: int = 100, filters: Dict = None) -> Dict[str, Any]:
        """Get paginated list of payments with filters"""
        payments = self.payment_crud.get_multi(self.db, skip=skip, limit=limit, filters=filters)
        total = self.payment_crud.count_all(self.db, filters=filters)
        
        return {
            "payments": [self._format_payment_response(payment) for payment in payments],
            "total": total,
            "page": (skip // limit) + 1,
            "size": limit
        }
    
    def get_farmer_payments(self, skip: int = 0, limit: int = 100, filters: Dict = None) -> Dict[str, Any]:
        """Get paginated list of farmer payments with filters"""
        farmer_payments = self.farmer_payment_crud.get_multi(self.db, skip=skip, limit=limit, filters=filters)
        total = self.farmer_payment_crud.count_all(self.db, filters=filters)
        
        return {
            "farmer_payments": [self._format_farmer_payment_response(fp) for fp in farmer_payments],
            "total": total,
            "page": (skip // limit) + 1,
            "size": limit
        }
    
    def update_payment(self, payment_id: int, payment_data) -> Optional[Dict[str, Any]]:
        """Update payment with validation"""
        try:
            payment = self.payment_crud.get_by_id(self.db, payment_id)
            if not payment:
                return None
            
            # If amount is being changed, validate against transaction
            if hasattr(payment_data, 'amount') and payment_data.amount != payment.amount:
                self._validate_payment_amount_update(payment, payment_data.amount)
            
            updated_payment = self.payment_crud.update(self.db, payment_id, payment_data)
            self.db.commit()
            
            return self._format_payment_response(updated_payment)
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to update payment: {str(e)}")
    
    def delete_payment(self, payment_id: int) -> bool:
        """Soft delete payment"""
        try:
            success = self.payment_crud.delete(self.db, payment_id)
            if success:
                self.db.commit()
            return success
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to delete payment: {str(e)}")
    
    def approve_farmer_payment(self, farmer_payment_id: int, approved_by: int = None) -> Optional[Dict[str, Any]]:
        """Approve farmer payment"""
        try:
            farmer_payment = self.farmer_payment_crud.get_by_id(self.db, farmer_payment_id)
            if not farmer_payment:
                return None
            
            # Set approval
            farmer_payment.approved_by = approved_by
            farmer_payment.status = RecordStatus.ACTIVE
            
            self.db.commit()
            
            return self._format_farmer_payment_response(farmer_payment)
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to approve farmer payment: {str(e)}")
    
    def get_payment_methods(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get available payment methods"""
        methods = self.payment_method_crud.get_all(self.db, active_only=active_only)
        return [method.to_dict() for method in methods]
    
    def get_transaction_payment_analytics(self, transaction_id: int) -> Optional[Dict[str, Any]]:
        """Get comprehensive payment analytics for a transaction"""
        from ....models import Transaction
        transaction = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return None
        
        # Get all payments for this transaction
        buyer_payments = self.payment_crud.get_by_transaction(self.db, transaction_id)
        farmer_payments = self.farmer_payment_crud.get_by_transaction(self.db, transaction_id)
        
        # Calculate totals
        total_buyer_paid = sum(float(p.amount or 0) for p in buyer_payments)
        total_farmer_paid = sum(float(fp.amount or 0) for fp in farmer_payments)
        
        transaction_total = float(transaction.total_amount or 0)
        commission_amount = float(transaction.commission_amount or 0)
        farmer_due = transaction_total - commission_amount
        
        return {
            "transaction_id": transaction_id,
            "transaction_total": transaction_total,
            "commission_amount": commission_amount,
            "farmer_due_amount": farmer_due,
            "buyer_payments": {
                "count": len(buyer_payments),
                "total_paid": total_buyer_paid,
                "remaining": transaction_total - total_buyer_paid,
                "percentage_complete": round((total_buyer_paid / transaction_total) * 100, 2) if transaction_total > 0 else 0
            },
            "farmer_payments": {
                "count": len(farmer_payments),
                "total_paid": total_farmer_paid,
                "remaining": farmer_due - total_farmer_paid,
                "percentage_complete": round((total_farmer_paid / farmer_due) * 100, 2) if farmer_due > 0 else 0
            },
            "completion_status": self._calculate_completion_status(transaction),
            "next_actions": self._get_next_payment_actions(transaction)
        }
    
    def get_payment_analytics_summary(self, date_from: str = None, date_to: str = None, shop_id: int = None) -> Dict[str, Any]:
        """Get payment analytics summary for a period"""
        return self.payment_crud.get_analytics_summary(self.db, date_from, date_to, shop_id)
    
    def search_payments(self, search_request) -> Dict[str, Any]:
        """Advanced search for payments"""
        return self.payment_crud.advanced_search(self.db, search_request)
    
    def batch_approve_farmer_payments(self, farmer_payment_ids: List[int], approved_by: int = None) -> Dict[str, Any]:
        """Batch approve multiple farmer payments"""
        approved = 0
        failed = 0
        errors = []
        
        for fp_id in farmer_payment_ids:
            try:
                result = self.approve_farmer_payment(fp_id, approved_by)
                if result:
                    approved += 1
                else:
                    failed += 1
                    errors.append(f"Farmer payment {fp_id} not found")
            except Exception as e:
                failed += 1
                errors.append(f"Farmer payment {fp_id}: {str(e)}")
        
        return {
            "approved": approved,
            "failed": failed,
            "errors": errors
        }
    
    def update_payment_status(self, payment_id: int, status: str, notes: str = None) -> Optional[Dict[str, Any]]:
        """Update payment status with notes"""
        try:
            payment = self.payment_crud.get_by_id(self.db, payment_id)
            if not payment:
                return None
            
            # Update status and notes
            payment.status = RecordStatus(status) if status in [s.value for s in RecordStatus] else payment.status
            if notes:
                payment.notes = notes
            
            self.db.commit()
            
            return self._format_payment_response(payment)
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to update payment status: {str(e)}")
    
    # Private helper methods
    def _update_transaction_completion_status(self, transaction):
        """Update transaction completion status based on payment progress"""
        total_amount = float(transaction.total_amount or 0)
        commission_amount = float(transaction.commission_amount or 0)
        farmer_due = total_amount - commission_amount
        
        buyer_paid = float(transaction.buyer_paid_amount or 0)
        farmer_paid = float(transaction.farmer_paid_amount or 0)
        
        buyer_complete = buyer_paid >= total_amount
        farmer_complete = farmer_paid >= farmer_due
        commission_confirmed = transaction.commission_confirmed or False
        
        if buyer_complete and farmer_complete and commission_confirmed:
            transaction.completion_status = 'complete'
        elif any([buyer_complete, farmer_complete, commission_confirmed]):
            transaction.completion_status = 'partial'
        else:
            transaction.completion_status = 'pending'
    
    def _calculate_completion_status(self, transaction) -> str:
        """Calculate transaction completion status"""
        total_amount = float(transaction.total_amount or 0)
        commission_amount = float(transaction.commission_amount or 0)
        farmer_due = total_amount - commission_amount
        
        buyer_paid = float(transaction.buyer_paid_amount or 0)
        farmer_paid = float(transaction.farmer_paid_amount or 0)
        
        buyer_complete = buyer_paid >= total_amount
        farmer_complete = farmer_paid >= farmer_due
        commission_confirmed = transaction.commission_confirmed or False
        
        if buyer_complete and farmer_complete and commission_confirmed:
            return 'complete'
        elif any([buyer_complete, farmer_complete, commission_confirmed]):
            return 'partial'
        else:
            return 'pending'
    
    def _get_next_payment_actions(self, transaction) -> List[str]:
        """Get list of next payment actions needed"""
        actions = []
        
        total_amount = float(transaction.total_amount or 0)
        commission_amount = float(transaction.commission_amount or 0)
        farmer_due = total_amount - commission_amount
        
        buyer_paid = float(transaction.buyer_paid_amount or 0)
        farmer_paid = float(transaction.farmer_paid_amount or 0)
        
        if buyer_paid < total_amount:
            remaining = total_amount - buyer_paid
            actions.append(f"Collect remaining buyer payment: ₹{remaining:.2f}")
        
        if farmer_paid < farmer_due:
            remaining = farmer_due - farmer_paid
            actions.append(f"Process farmer payment: ₹{remaining:.2f}")
        
        if not transaction.commission_confirmed:
            actions.append(f"Confirm commission: ₹{commission_amount:.2f}")
        
        return actions
    
    def _validate_payment_amount_update(self, payment: Payment, new_amount: float):
        """Validate payment amount update against transaction limits"""
        if new_amount <= 0:
            raise ValueError("Payment amount must be positive")
        
        # Get transaction and calculate limits
        from ....models import Transaction
        transaction = self.db.query(Transaction).filter(Transaction.id == payment.transaction_id).first()
        if not transaction:
            raise ValueError("Associated transaction not found")
        
        # Calculate total without this payment
        current_total = float(transaction.buyer_paid_amount or 0)
        old_amount = float(payment.amount or 0)
        other_payments_total = current_total - old_amount
        new_total = other_payments_total + new_amount
        
        transaction_total = float(transaction.total_amount or 0)
        if new_total > transaction_total:
            raise ValueError(f"Updated amount would exceed transaction total")
    
    def _format_payment_response(self, payment: Payment) -> Dict[str, Any]:
        """Format payment for API response"""
        data = payment.to_dict()
        
        # Add related information if available
        if hasattr(payment, 'payment_method') and payment.payment_method:
            data['payment_method_name'] = payment.payment_method.name
        
        if hasattr(payment, 'transaction') and payment.transaction:
            data['transaction_info'] = {
                'total_amount': float(payment.transaction.total_amount or 0),
                'completion_status': payment.transaction.completion_status
            }
        
        return data
    
    def _format_farmer_payment_response(self, farmer_payment: FarmerPayment) -> Dict[str, Any]:
        """Format farmer payment for API response"""
        data = farmer_payment.to_dict()
        
        # Add related information if available
        if hasattr(farmer_payment, 'farmer_user') and farmer_payment.farmer_user:
            data['farmer_name'] = farmer_payment.farmer_user.username
        
        if hasattr(farmer_payment, 'payment_method') and farmer_payment.payment_method:
            data['payment_method_name'] = farmer_payment.payment_method.name
        
        return data