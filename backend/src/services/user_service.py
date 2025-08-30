from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional
from ..models import User, RecordStatus
from ..database import get_db
from ..schemas import APIResponse, PaginationParams
from fastapi import Depends, HTTPException

class UserService:
    @staticmethod
    def get_users(
        db: Session,
        pagination: Optional[PaginationParams] = None,
        shop_id: Optional[int] = None, 
        role: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ):
        """Get users with pagination and filtering"""
        try:
            query = db.query(User)
            
            # Apply filters
            if shop_id:
                query = query.filter(User.shop_id == shop_id)
            if role:
                query = query.filter(User.role == role)
            if status:
                # Convert status to lowercase for enum compatibility
                status_lower = status.lower()
                query = query.filter(User.status == status_lower)
            if search:
                search_filter = or_(
                    User.username.ilike(f"%{search}%"),
                    User.contact.ilike(f"%{search}%")
                )
                query = query.filter(search_filter)
            
            # Apply sorting
            if sort_by:
                column = getattr(User, sort_by, None)
                if column:
                    if sort_order and sort_order.lower() == 'desc':
                        query = query.order_by(desc(column))
                    else:
                        query = query.order_by(asc(column))
            
            # Get total count
            total_count = query.count()
            
            # Apply pagination
            skip = 0
            limit = 100
            if pagination:
                skip = (pagination.page - 1) * pagination.limit
                limit = pagination.limit
            
            users = query.offset(skip).limit(limit).all()
            
            # Convert users to dict format
            users_data = []
            for user in users:
                user_dict = {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                    "shop_id": user.shop_id,
                    "contact": user.contact,
                    "status": user.status,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "updated_at": user.updated_at.isoformat() if user.updated_at else None
                }
                users_data.append(user_dict)
            
            return APIResponse(
                success=True,
                message="Users retrieved successfully",
                data={
                    "users": users_data,
                    "total": total_count,
                    "page": pagination.page if pagination else 1,
                    "limit": pagination.limit if pagination else limit,
                    "total_pages": (total_count + limit - 1) // limit
                }
            )
            
        except Exception as e:
            return APIResponse(
                success=False,
                message=f"Failed to get users: {str(e)}",
                data=None
            )
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def create_user(db: Session, username: str, password_hash: str, role: str, shop_id: Optional[int] = None, contact: str = None, credit_limit: float = 0.0, status: str = "active"):
        from sqlalchemy.exc import IntegrityError
        import logging
        logger = logging.getLogger(__name__)
        from ..models import UserRole
        try:
            # Convert role string to Enum if needed
            role_enum = UserRole(role) if isinstance(role, str) else role
            from ..models import RecordStatus
            status_enum = RecordStatus(status) if isinstance(status, str) else status
            user = User(
                username=username,
                password_hash=password_hash,
                role=role_enum,
                contact=contact,
                credit_limit=credit_limit,
                status=status_enum
            )
            # Only set shop_id for non-owner roles
            if shop_id is not None and role_enum != UserRole.OWNER:
                user.shop_id = shop_id
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"✅ User created successfully: {username} (ID: {user.id})")
            return APIResponse(
                success=True,
                message=f"User '{username}' created successfully",
                data={
                    "id": user.id,
                    "username": user.username,
                    "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                    "contact": user.contact,
                    "credit_limit": float(user.credit_limit),
                    "status": user.status,
                    "created_at": user.created_at.isoformat(),
                    "updated_at": user.updated_at.isoformat()
                }
            )
        except IntegrityError as e:
            db.rollback()
            error_msg = str(e.orig).lower()
            if "unique constraint" in error_msg and "username" in error_msg:
                logger.warning(f"❌ Username already exists: {username}")
                return APIResponse(
                    success=False,
                    message=f"Username '{username}' already exists. Please choose a different username.",
                    errors=["DUPLICATE_USERNAME"]
                )
            elif "check constraint" in error_msg:
                logger.warning(f"❌ Invalid data provided for user: {username}")
                return APIResponse(
                    success=False,
                    message="Invalid data provided. Please check your input values.",
                    errors=["INVALID_DATA"]
                )
            else:
                logger.error(f"❌ Database integrity error creating user {username}: {str(e)}")
                return APIResponse(
                    success=False,
                    message="Database constraint violation occurred.",
                    errors=["DATABASE_CONSTRAINT_VIOLATION"]
                )
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Unexpected error creating user {username}: {str(e)}")
            return APIResponse(
                success=False,
                message="An unexpected error occurred while creating the user.",
                errors=["INTERNAL_ERROR"]
            )
    
    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return True
        return False

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str):
        from ..schemas import APIResponse
        import hashlib
        import logging
        logger = logging.getLogger(__name__)
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        logger.info(f"Authenticating user: {username}")

        # Log database info
        try:
            db_name = db.bind.url.database if db.bind and db.bind.url else None
            logger.info(f"Connected to database: {db_name}")
            tables = db.bind.table_names() if db.bind else []
            logger.info(f"Available tables: {tables}")
        except Exception as e:
            logger.warning(f"Could not retrieve DB info: {e}")

        # Check superadmin table first using raw SQL to avoid enum issues
        from ..models import Superadmin
        logger.info(f"Checking superadmin table for username: {username}")
        
        # Use raw SQL query to avoid enum processing issues
        from sqlalchemy import text
        result = db.execute(text("""
            SELECT id, username, password_hash, email, contact, created_at, updated_at, status::text as status_text
            FROM superadmin 
            WHERE username = :username
        """), {"username": username})
        
        superadmin_row = result.fetchone()
        if superadmin_row:
            logger.info(f"Superadmin found: {username}, comparing password hashes")
            logger.debug(f"Provided hash: {password_hash}, Stored hash: {superadmin_row.password_hash}")
            if superadmin_row.password_hash == password_hash:
                logger.info(f"Authentication successful for superadmin: {username}")
                response = APIResponse(success=True, message="Superadmin authentication successful", data={
                    "id": superadmin_row.id,
                    "username": superadmin_row.username,
                    "role": "superadmin",
                    "email": superadmin_row.email,
                    "contact": superadmin_row.contact
                })
                logger.info(f"Response: {response}")
                return response
            logger.warning(f"Invalid password for superadmin: {username}")
            response = APIResponse(success=False, message="Invalid password for superadmin", data=None)
            logger.info(f"Response: {response}")
            return response

        # Check regular users table
        logger.info(f"Checking users table for username: {username}")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            logger.warning(f"User not found: {username}")
            response = APIResponse(success=False, message=f"User not found: {username}", data=None)
            logger.info(f"Response: {response}")
            return response
        logger.info(f"User found: {username}, comparing password hashes")
        logger.debug(f"Provided hash: {password_hash}, Stored hash: {user.password_hash}")
        if user.password_hash == password_hash:
            logger.info(f"Authentication successful for user: {username}")
            response = APIResponse(success=True, message="Authentication successful", data={
                "id": user.id,
                "username": user.username,
                "role": user.role.value if hasattr(user.role, 'value') else user.role,
                "shop_id": user.shop_id,
                "contact": user.contact
            })
            logger.info(f"Response: {response}")
            return response
        logger.warning(f"Invalid password for user: {username}")
        response = APIResponse(success=False, message="Invalid password", data=None)
        logger.info(f"Response: {response}")
        return response

# Add missing function that other modules are trying to import
# This is a placeholder - in a real app, this would validate JWT tokens

def get_current_user(db: Session = Depends(get_db)) -> User:
    """Get current authenticated user - placeholder implementation"""
    # In a real application, this would:
    # 1. Extract JWT token from request headers
    # 2. Validate and decode the token
    # 3. Get user from database based on token payload
    
    # For now, return a mock owner user for testing
    user = db.query(User).filter(User.role == 'owner').first()
    if not user:
        raise HTTPException(status_code=401, detail="No authenticated user found")
    return user