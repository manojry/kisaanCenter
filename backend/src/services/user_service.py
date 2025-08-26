from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from ..crud.user_crud import UserCRUD
from ..schemas import (
    UserCreate, UserUpdate, UserRead, UserReadWithRelations,
    PaginationParams, PaginatedResponse, APIResponse, ErrorResponse
)
from ..models import User
import logging

logger = logging.getLogger(__name__)

class UserService:
    """
    Enterprise-level User service with comprehensive business logic
    Handles validation, business rules, error handling, and orchestration
    """
    
    @staticmethod
    def create_user(
        db: Session, 
        user_create: UserCreate, 
        created_by_id: Optional[int] = None
    ) -> APIResponse:
        """
        Create a new user with full business validation
        
        Args:
            db: Database session
            user_create: User creation data
            created_by_id: ID of user creating this record
            
        Returns:
            APIResponse with created user or error details
        """
        try:
            # Business rule validations
            validation_errors = UserService._validate_user_create(user_create)
            if validation_errors:
                return APIResponse(
                    success=False,
                    message="Validation failed",
                    errors=validation_errors
                )
            
            # Role-specific validations
            role_validation = UserService._validate_user_role_constraints(user_create)
            if role_validation:
                return APIResponse(
                    success=False,
                    message="Role validation failed",
                    errors=[role_validation]
                )
            
            # Create user via CRUD
            user = UserCRUD.create(db, user_create, created_by_id)
            db.commit()
            
            # Log successful creation
            logger.info(f"User created successfully: {user.username} (ID: {user.id})")
            
            return APIResponse(
                success=True,
                message="User created successfully",
                data=UserRead.model_validate(user)
            )
            
        except ValueError as e:
            db.rollback()
            logger.warning(f"User creation validation error: {str(e)}")
            return APIResponse(
                success=False,
                message=str(e),
                errors=["Validation error"]
            )
        except Exception as e:
            db.rollback()
            logger.error(f"User creation failed: {str(e)}")
            return APIResponse(
                success=False,
                message="Failed to create user",
                errors=["Internal server error"]
            )
    
    @staticmethod
    def get_user(
        db: Session, 
        user_id: int, 
        include_relations: bool = False
    ) -> APIResponse:
        """
        Get user by ID with optional relations
        
        Args:
            db: Database session
            user_id: User ID to fetch
            include_relations: Whether to include related entities
            
        Returns:
            APIResponse with user data or error
        """
        try:
            user = UserCRUD.get_by_id(db, user_id, include_relations)
            if not user:
                return APIResponse(
                    success=False,
                    message="User not found",
                    errors=["User with specified ID does not exist"]
                )
            
            schema_class = UserReadWithRelations if include_relations else UserRead
            return APIResponse(
                success=True,
                message="User retrieved successfully",
                data=schema_class.model_validate(user)
            )
            
        except Exception as e:
            logger.error(f"Failed to get user {user_id}: {str(e)}")
            return APIResponse(
                success=False,
                message="Failed to retrieve user",
                errors=["Internal server error"]
            )
    
    @staticmethod
    def get_users(
        db: Session,
        pagination: PaginationParams,
        shop_id: Optional[int] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> APIResponse:
        """
        Get paginated list of users with filtering
        
        Args:
            db: Database session
            pagination: Pagination parameters
            shop_id: Filter by shop ID
            role: Filter by user role
            status: Filter by status
            search: Search term
            sort_by: Sort field
            sort_order: Sort direction
            
        Returns:
            APIResponse with paginated user data
        """
        try:
            result = UserCRUD.get_multi(
                db=db,
                pagination=pagination,
                shop_id=shop_id,
                role=role,
                status=status,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
            
            # Convert users to schema
            users_data = [UserRead.model_validate(user) for user in result["items"]]
            
            paginated_response = PaginatedResponse(
                items=users_data,
                total=result["total"],
                page=result["page"],
                limit=result["limit"],
                total_pages=result["total_pages"]
            )
            
            return APIResponse(
                success=True,
                message="Users retrieved successfully",
                data=paginated_response
            )
            
        except Exception as e:
            logger.error(f"Failed to get users: {str(e)}")
            return APIResponse(
                success=False,
                message="Failed to retrieve users",
                errors=["Internal server error"]
            )
    
    @staticmethod
    def update_user(
        db: Session, 
        user_id: int, 
        user_update: UserUpdate, 
        updated_by_id: Optional[int] = None
    ) -> APIResponse:
        """
        Update user with business validation
        
        Args:
            db: Database session
            user_id: User ID to update
            user_update: Update data
            updated_by_id: ID of user making the update
            
        Returns:
            APIResponse with updated user or error
        """
        try:
            # Check if user exists
            existing_user = UserCRUD.get_by_id(db, user_id)
            if not existing_user:
                return APIResponse(
                    success=False,
                    message="User not found",
                    errors=["User with specified ID does not exist"]
                )
            
            # Business rule validations
            validation_errors = UserService._validate_user_update(user_update, existing_user)
            if validation_errors:
                return APIResponse(
                    success=False,
                    message="Validation failed",
                    errors=validation_errors
                )
            
            # Update user
            updated_user = UserCRUD.update(db, user_id, user_update, updated_by_id)
            db.commit()
            
            logger.info(f"User updated successfully: {updated_user.username} (ID: {user_id})")
            
            return APIResponse(
                success=True,
                message="User updated successfully",
                data=UserRead.model_validate(updated_user)
            )
            
        except ValueError as e:
            db.rollback()
            return APIResponse(
                success=False,
                message=str(e),
                errors=["Validation error"]
            )
        except Exception as e:
            db.rollback()
            logger.error(f"User update failed: {str(e)}")
            return APIResponse(
                success=False,
                message="Failed to update user",
                errors=["Internal server error"]
            )
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> APIResponse:
        """
        Soft delete user with business rule checks
        
        Args:
            db: Database session
            user_id: User ID to delete
            
        Returns:
            APIResponse indicating success or failure
        """
        try:
            # Check if user exists
            user = UserCRUD.get_by_id(db, user_id)
            if not user:
                return APIResponse(
                    success=False,
                    message="User not found",
                    errors=["User with specified ID does not exist"]
                )
            
            # Business rule: Check if user can be deleted
            deletion_check = UserService._can_delete_user(db, user)
            if not deletion_check["can_delete"]:
                return APIResponse(
                    success=False,
                    message="User cannot be deleted",
                    errors=deletion_check["reasons"]
                )
            
            # Perform soft delete
            success = UserCRUD.delete(db, user_id)
            if success:
                db.commit()
                logger.info(f"User soft deleted: {user.username} (ID: {user_id})")
                return APIResponse(
                    success=True,
                    message="User deleted successfully"
                )
            else:
                return APIResponse(
                    success=False,
                    message="Failed to delete user",
                    errors=["Deletion operation failed"]
                )
                
        except Exception as e:
            db.rollback()
            logger.error(f"User deletion failed: {str(e)}")
            return APIResponse(
                success=False,
                message="Failed to delete user",
                errors=["Internal server error"]
            )
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> APIResponse:
        """
        Authenticate user credentials
        
        Args:
            db: Database session
            username: Username
            password: Password
            
        Returns:
            APIResponse with user data if authenticated
        """
        try:
            user = UserCRUD.authenticate(db, username, password)
            if not user:
                return APIResponse(
                    success=False,
                    message="Invalid credentials",
                    errors=["Username or password is incorrect"]
                )
            
            return APIResponse(
                success=True,
                message="Authentication successful",
                data=UserRead.model_validate(user)
            )
            
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            return APIResponse(
                success=False,
                message="Authentication failed",
                errors=["Internal server error"]
            )
    
    # Private validation methods
    
    @staticmethod
    def _validate_user_create(user_create: UserCreate) -> List[str]:
        """Validate user creation data"""
        errors = []
        
        # Username validation
        if len(user_create.username) < 3:
            errors.append("Username must be at least 3 characters long")
        
        if len(user_create.username) > 50:
            errors.append("Username cannot exceed 50 characters")
        
        # Password validation
        if len(user_create.password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        # Credit limit validation
        if user_create.credit_limit and user_create.credit_limit < 0:
            errors.append("Credit limit cannot be negative")
        
        # Contact validation
        if user_create.contact and len(user_create.contact) > 20:
            errors.append("Contact cannot exceed 20 characters")
        
        return errors
    
    @staticmethod
    def _validate_user_role_constraints(user_create: UserCreate) -> Optional[str]:
        """Validate role-specific constraints"""
        
        # Superadmin shouldn't have shop_id
        if user_create.role == "superadmin" and user_create.shop_id:
            return "Superadmin users cannot be assigned to a specific shop"
        
        # Other roles must have shop_id
        if user_create.role != "superadmin" and not user_create.shop_id:
            return f"Users with role '{user_create.role}' must be assigned to a shop"
        
        # Only buyers and farmers can have credit limits
        if user_create.credit_limit and user_create.role not in ["buyer", "farmer"]:
            return "Credit limit can only be set for buyers and farmers"
        
        return None
    
    @staticmethod
    def _validate_user_update(user_update: UserUpdate, existing_user: User) -> List[str]:
        """Validate user update data"""
        errors = []
        
        # Username validation if provided
        if user_update.username:
            if len(user_update.username) < 3:
                errors.append("Username must be at least 3 characters long")
            if len(user_update.username) > 50:
                errors.append("Username cannot exceed 50 characters")
        
        # Credit limit validation
        if user_update.credit_limit is not None:
            if user_update.credit_limit < 0:
                errors.append("Credit limit cannot be negative")
            
            if existing_user.role not in ["buyer", "farmer"]:
                errors.append("Credit limit can only be set for buyers and farmers")
        
        return errors
    
    @staticmethod
    def _can_delete_user(db: Session, user: User) -> Dict[str, Any]:
        """Check if user can be deleted based on business rules"""
        reasons = []
        
        # Check for active transactions
        # This would need actual transaction checking
        # if has_active_transactions(db, user.id):
        #     reasons.append("User has active transactions")
        
        # Check for outstanding credit
        # if has_outstanding_credit(db, user.id):
        #     reasons.append("User has outstanding credit")
        
        # Check if user is the only owner/admin
        if user.role == "owner":
            # Check if there are other owners in the shop
            pass
        
        return {
            "can_delete": len(reasons) == 0,
            "reasons": reasons
        }
