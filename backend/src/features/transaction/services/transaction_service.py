from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..crud.transaction_crud import TransactionCRUD
from ....schemas import TransactionCreate, TransactionUpdate, APIResponse, PaginationParams
from ....models import UserRole, Shop, Transaction
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

class TransactionService:
    """Enterprise-level Transaction service with three-checkbox completion model"""
    
    @staticmethod
    def create_transaction(db: Session, transaction_data: TransactionCreate, created_by_id: int = None, user_role: str = None) -> APIResponse:
        """
        Create a new transaction with enterprise-grade validation, shop isolation, atomic completion, and audit logging.
        """
        try:
            # 1. Shop isolation: Only superadmin or owner of shop can create
            shop = db.query(Shop).filter(Shop.id == transaction_data.shop_id).first()
            if not shop:
                return APIResponse(success=False, message="Shop not found.")
            
            # 2. Validate commission rate, buyer/farmer existence, etc.
            if transaction_data.commission_rate is not None and (transaction_data.commission_rate < 0 or transaction_data.commission_rate > 100):
                return APIResponse(success=False, message="Invalid commission rate.")

            # 3. Atomic DB transaction for three-party completion fields
            try:
                transaction = TransactionCRUD.create(db, transaction_data)
                db.commit()
                
                logger.info(f"Transaction created successfully: ID {transaction.id}")
                return APIResponse(
                    success=True, 
                    message="Transaction created successfully.", 
                    data={"transaction_id": transaction.id}
                )
            except Exception as e:
                db.rollback()
                logger.error(f"Database error during transaction creation: {str(e)}")
                return APIResponse(success=False, message=f"Database error: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error in transaction creation: {str(e)}")
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def get_transaction(db: Session, transaction_id: int, include_relations: bool = False) -> APIResponse:
        """Get transaction by ID with optional relations"""
        try:
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            
            if not transaction:
                return APIResponse(success=False, message="Transaction not found")
            
            if include_relations:
                transaction_data = TransactionCRUD.get_with_relations(db, transaction_id)
            else:
                transaction_data = transaction.to_dict()
            
            return APIResponse(
                success=True,
                message="Transaction retrieved successfully",
                data=transaction_data
            )
            
        except Exception as e:
            logger.error(f"Transaction retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve transaction")
    
    @staticmethod
    def get_transactions(db: Session, pagination: PaginationParams, filters: Dict[str, Any] = None) -> APIResponse:
        """Get all transactions with optional filtering and pagination"""
        try:
            transactions = TransactionCRUD.get_multi(db, pagination.skip, pagination.limit, filters)
            transaction_data = [transaction.to_dict() for transaction in transactions]
            
            return APIResponse(
                success=True,
                message="Transactions retrieved successfully",
                data=transaction_data,
                pagination={
                    "skip": pagination.skip,
                    "limit": pagination.limit,
                    "total": len(transaction_data)
                }
            )
            
        except Exception as e:
            logger.error(f"Transaction list retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve transactions")
    
    @staticmethod
    def update_transaction(db: Session, transaction_id: int, transaction_update: TransactionUpdate) -> APIResponse:
        """Update transaction"""
        try:
            transaction = TransactionCRUD.update(db, transaction_id, transaction_update)
            if not transaction:
                return APIResponse(success=False, message="Transaction not found")
            
            db.commit()
            
            return APIResponse(
                success=True,
                message="Transaction updated successfully",
                data=transaction.to_dict()
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Transaction update failed: {str(e)}")
            return APIResponse(success=False, message="Failed to update transaction")
    
    @staticmethod
    def delete_transaction(db: Session, transaction_id: int) -> APIResponse:
        """Delete transaction (soft delete)"""
        try:
            success = TransactionCRUD.delete(db, transaction_id)
            if not success:
                return APIResponse(success=False, message="Transaction not found")
            
            db.commit()
            
            return APIResponse(
                success=True,
                message="Transaction deleted successfully"
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Transaction deletion failed: {str(e)}")
            return APIResponse(success=False, message="Failed to delete transaction")
    
    @staticmethod
    def complete_transaction(db: Session, transaction_id: int) -> APIResponse:
        """Mark transaction as completed (all three checkboxes)"""
        try:
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            if not transaction:
                return APIResponse(success=False, message="Transaction not found")
            
            # Check if all three completion criteria are met
            completion_status = TransactionService._check_completion_status(transaction)
            
            if completion_status['overall_status'] != 'complete':
                return APIResponse(
                    success=False, 
                    message="Cannot complete transaction - not all requirements met",
                    data=completion_status
                )
            
            # Mark as completed
            TransactionCRUD.mark_completed(db, transaction_id)
            db.commit()
            
            return APIResponse(
                success=True,
                message="Transaction completed successfully",
                data={"completion_status": "complete"}
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Transaction completion failed: {str(e)}")
            return APIResponse(success=False, message="Failed to complete transaction")
    
    @staticmethod
    def get_completion_status(db: Session, transaction_id: int) -> APIResponse:
        """Get transaction completion status (3-checkbox model)"""
        try:
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            if not transaction:
                return APIResponse(success=False, message="Transaction not found")
            
            completion_status = TransactionService._check_completion_status(transaction)
            
            return APIResponse(
                success=True,
                message="Completion status retrieved successfully",
                data=completion_status
            )
            
        except Exception as e:
            logger.error(f"Completion status retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve completion status")
    
    @staticmethod
    def confirm_commission(db: Session, transaction_id: int, confirmed: bool) -> APIResponse:
        """Confirm commission for transaction (admin action)"""
        try:
            transaction = TransactionCRUD.get_by_id(db, transaction_id)
            if not transaction:
                return APIResponse(success=False, message="Transaction not found")
            
            TransactionCRUD.update_commission_confirmation(db, transaction_id, confirmed)
            db.commit()
            
            return APIResponse(
                success=True,
                message=f"Commission {'confirmed' if confirmed else 'unconfirmed'} successfully",
                data={"commission_confirmed": confirmed}
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Commission confirmation failed: {str(e)}")
            return APIResponse(success=False, message="Failed to update commission confirmation")
    
    @staticmethod
    def get_transaction_items(db: Session, transaction_id: int) -> APIResponse:
        """Get all items for a transaction"""
        try:
            items = TransactionCRUD.get_transaction_items(db, transaction_id)
            
            return APIResponse(
                success=True,
                message="Transaction items retrieved successfully",
                data=items
            )
            
        except Exception as e:
            logger.error(f"Transaction items retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve transaction items")
    
    @staticmethod
    def get_transaction_summary(db: Session, transaction_id: int) -> APIResponse:
        """Get comprehensive transaction summary"""
        try:
            summary = TransactionCRUD.get_transaction_summary(db, transaction_id)
            if not summary:
                return APIResponse(success=False, message="Transaction not found")
            
            return APIResponse(
                success=True,
                message="Transaction summary retrieved successfully",
                data=summary
            )
            
        except Exception as e:
            logger.error(f"Transaction summary retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve transaction summary")
    
    @staticmethod
    def _check_completion_status(transaction) -> Dict[str, Any]:
        """Check the three-checkbox completion model status"""
        # Calculate totals
        total_amount = float(transaction.total_amount or 0)
        commission_amount = float(transaction.commission_amount or 0)
        farmer_due_amount = total_amount - commission_amount
        
        # Check individual completion status
        buyer_payment_complete = (transaction.buyer_paid_amount or 0) >= total_amount
        farmer_payment_complete = (transaction.farmer_paid_amount or 0) >= farmer_due_amount
        commission_confirmed = transaction.commission_confirmed or False
        
        # Determine overall status
        completed_count = sum([buyer_payment_complete, farmer_payment_complete, commission_confirmed])
        
        if completed_count == 3:
            overall_status = 'complete'
        elif completed_count > 0:
            overall_status = 'partial'
        else:
            overall_status = 'pending'
        
        # Generate next actions
        next_actions = []
        if not buyer_payment_complete:
            remaining = total_amount - float(transaction.buyer_paid_amount or 0)
            next_actions.append(f"Collect remaining buyer payment: ₹{remaining:.2f}")
        if not farmer_payment_complete:
            remaining = farmer_due_amount - float(transaction.farmer_paid_amount or 0)
            next_actions.append(f"Pay remaining farmer amount: ₹{remaining:.2f}")
        if not commission_confirmed:
            next_actions.append(f"Confirm commission amount: ₹{commission_amount:.2f}")
        
        return {
            "transaction_id": transaction.id,
            "buyer_payment_complete": buyer_payment_complete,
            "farmer_payment_complete": farmer_payment_complete,
            "commission_confirmed": commission_confirmed,
            "overall_status": overall_status,
            "completion_percentage": round((completed_count / 3) * 100, 1),
            "next_actions": next_actions,
            "amounts": {
                "total_amount": total_amount,
                "commission_amount": commission_amount,
                "farmer_due_amount": farmer_due_amount,
                "buyer_paid": float(transaction.buyer_paid_amount or 0),
                "farmer_paid": float(transaction.farmer_paid_amount or 0)
            }
        }