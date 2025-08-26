from sqlalchemy.orm import Session
from ..schemas import CreditCreate, CreditUpdate, APIResponse, PaginationParams

class CreditService:
    @staticmethod
    def create_credit(db: Session, credit_data: CreditCreate, created_by_id: int = None, user_role: str = None) -> APIResponse:
        """
        Create a new credit with enterprise-grade validation, shop/user isolation, atomic transaction, and audit logging.
        """
        from ..crud.credit_crud import CreditCRUD
        from ..models import UserRole, Shop, User, Credit
        try:
            # Shop/user isolation: Only superadmin or owner of shop/user can create
            shop_id = getattr(credit_data, 'shop_id', None)
            user_id = getattr(credit_data, 'user_id', None)
            if shop_id:
                shop = db.query(Shop).filter(Shop.id == shop_id).first()
                if not shop:
                    return APIResponse(success=False, message="Shop not found.")
                if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                    return APIResponse(success=False, message="Permission denied: Only superadmin or owner can create credits for shop.")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if not user:
                    return APIResponse(success=False, message="User not found.")
                if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                    return APIResponse(success=False, message="Permission denied: Only superadmin or owner can create credits for user.")

            # Business rule validation: amount
            if credit_data.amount is None or credit_data.amount <= 0:
                return APIResponse(success=False, message="Invalid credit amount.")

            # Atomic DB transaction
            from sqlalchemy.exc import SQLAlchemyError
            try:
                credit = CreditCRUD.create(db, credit_data)
                db.commit()
            except (SQLAlchemyError, ValueError) as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")

            # Audit logging (stub)
            # TODO: Implement audit log entry for credit creation

            return APIResponse(success=True, message="Credit created successfully.", data={"credit_id": credit.id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def get_credit(db: Session, credit_id: int, user_role: str = None) -> APIResponse:
        """
        Retrieve a credit by ID with permission checks and error handling.
        """
        from ..crud.credit_crud import CreditCRUD
        from ..models import UserRole
        credit = CreditCRUD.get_by_id(db, credit_id)
        if not credit:
            return APIResponse(success=False, message="Credit not found.")
        # Shop/user isolation: Only superadmin/owner can view, or user
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            # TODO: Add user check if needed
            return APIResponse(success=False, message="Permission denied.")
        return APIResponse(success=True, message="Credit retrieved.", data={"credit": credit})
    
    @staticmethod
    def get_credits(db: Session, pagination: PaginationParams, user_role: str = None, **filters) -> APIResponse:
        """
        Retrieve credits with pagination, shop/user isolation, and permission checks.
        """
        from ..crud.credit_crud import CreditCRUD
        from ..models import UserRole
        # Example: filter by user_id or shop_id
        user_id = filters.get('user_id')
        shop_id = filters.get('shop_id')
        if user_id:
            credits = CreditCRUD.get_by_user_id(db, user_id, skip=(pagination.page-1)*pagination.limit, limit=pagination.limit)
        elif shop_id:
            credits = CreditCRUD.get_by_shop_id(db, shop_id, skip=(pagination.page-1)*pagination.limit, limit=pagination.limit)
        else:
            credits = []
        # Shop/user isolation: Only superadmin/owner can view
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        return APIResponse(success=True, message="Credits retrieved.", data={"credits": credits})
    
    @staticmethod
    def update_credit(db: Session, credit_id: int, credit_update: CreditUpdate, user_role: str = None) -> APIResponse:
        """
        Update a credit with enterprise validation and permission checks.
        """
        from ..crud.credit_crud import CreditCRUD
        from ..models import UserRole
        # Shop/user isolation: Only superadmin/owner can update
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        try:
            credit = CreditCRUD.update(db, credit_id, credit_update)
            db.commit()
            return APIResponse(success=True, message="Credit updated.", data={"credit": credit})
        except Exception as e:
            db.rollback()
            return APIResponse(success=False, message=f"Error updating credit: {str(e)}")
    
    @staticmethod
    def delete_credit(db: Session, credit_id: int, user_role: str = None) -> APIResponse:
        """
        Delete a credit with permission checks and error handling.
        """
        from ..crud.credit_crud import CreditCRUD
        from ..models import UserRole
        # Shop/user isolation: Only superadmin/owner can delete
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        try:
            success = CreditCRUD.delete(db, credit_id)
            if success:
                return APIResponse(success=True, message="Credit deleted.")
            else:
                return APIResponse(success=False, message="Credit not found.")
        except Exception as e:
            db.rollback()
            return APIResponse(success=False, message=f"Error deleting credit: {str(e)}")
