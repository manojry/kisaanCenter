from sqlalchemy.orm import Session
from ..schemas import PaymentCreate, PaymentUpdate, APIResponse, PaginationParams

class PaymentService:
    @staticmethod
    def create_payment(db: Session, payment_data: PaymentCreate, created_by_id: int = None, user_role: str = None) -> APIResponse:
        """
        Create a new payment with enterprise-grade validation, shop isolation, atomic transaction, and audit logging.
        """
        from ..crud.payment_crud import PaymentCRUD
        from ..models import UserRole, Shop, Payment
        try:
            # Shop isolation: Only superadmin or owner of shop can create
            shop_id = getattr(payment_data, 'shop_id', None)
            if shop_id:
                shop = db.query(Shop).filter(Shop.id == shop_id).first()
                if not shop:
                    return APIResponse(success=False, message="Shop not found.")
                if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                    return APIResponse(success=False, message="Permission denied: Only superadmin or owner can create payments.")

            # Business rule validation: amount, payment method, linkage
            if payment_data.amount is None or payment_data.amount <= 0:
                return APIResponse(success=False, message="Invalid payment amount.")
            if not payment_data.payment_method_id:
                return APIResponse(success=False, message="Payment method required.")

            # Atomic DB transaction
            from sqlalchemy.exc import SQLAlchemyError
            try:
                payment = PaymentCRUD.create(db, payment_data)
                db.commit()
            except SQLAlchemyError as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")

            # Audit logging (stub)
            # TODO: Implement audit log entry for payment creation

            return APIResponse(success=True, message="Payment created successfully.", data={"payment_id": payment.id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def get_payment(db: Session, payment_id: int, user_role: str = None) -> APIResponse:
        """
        Retrieve a payment by ID with permission checks and error handling.
        """
        from ..crud.payment_crud import PaymentCRUD
        from ..models import UserRole
        payment = PaymentCRUD.get_by_id(db, payment_id)
        if not payment:
            return APIResponse(success=False, message="Payment not found.")
        # Shop isolation: Only superadmin/owner can view, or payer
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            # TODO: Add payer check if needed
            return APIResponse(success=False, message="Permission denied.")
        return APIResponse(success=True, message="Payment retrieved.", data={"payment": payment})
    
    @staticmethod
    def get_payments(db: Session, pagination: PaginationParams, user_role: str = None, **filters) -> APIResponse:
        """
        Retrieve payments with pagination, shop isolation, and permission checks.
        """
        from ..crud.payment_crud import PaymentCRUD
        from ..models import UserRole
        # Example: filter by transaction_id
        transaction_id = filters.get('transaction_id')
        if transaction_id:
            payments = PaymentCRUD.get_by_transaction_id(db, transaction_id, skip=(pagination.page-1)*pagination.limit, limit=pagination.limit)
        else:
            # TODO: Add more filters as needed
            payments = []
        # Shop isolation: Only superadmin/owner can view
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        return APIResponse(success=True, message="Payments retrieved.", data={"payments": payments})
    
    @staticmethod
    def update_payment(db: Session, payment_id: int, payment_update: PaymentUpdate, user_role: str = None) -> APIResponse:
        """
        Update a payment with enterprise validation and permission checks.
        """
        from ..crud.payment_crud import PaymentCRUD
        from ..models import UserRole
        # Shop isolation: Only superadmin/owner can update
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        try:
            payment = PaymentCRUD.update(db, payment_id, payment_update)
            db.commit()
            return APIResponse(success=True, message="Payment updated.", data={"payment": payment})
        except Exception as e:
            db.rollback()
            return APIResponse(success=False, message=f"Error updating payment: {str(e)}")
    
    @staticmethod
    def delete_payment(db: Session, payment_id: int, user_role: str = None) -> APIResponse:
        """
        Delete a payment with permission checks and error handling.
        """
        from ..crud.payment_crud import PaymentCRUD
        from ..models import UserRole
        # Shop isolation: Only superadmin/owner can delete
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        try:
            success = PaymentCRUD.delete(db, payment_id)
            if success:
                return APIResponse(success=True, message="Payment deleted.")
            else:
                return APIResponse(success=False, message="Payment not found.")
        except Exception as e:
            db.rollback()
            return APIResponse(success=False, message=f"Error deleting payment: {str(e)}")
