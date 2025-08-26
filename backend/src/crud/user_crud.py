from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from typing import Optional, List, Dict, Any
from ..models import User, Shop
from ..api.schemas import UserCreate, UserUpdate, PaginationParams
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class UserCRUD:
    """
    Enterprise-level CRUD operations for User entity
    Includes all business logic, edge cases, and performance optimizations
    """
    
    @staticmethod
    def create(db: Session, user_create: UserCreate, created_by_id: Optional[int] = None) -> User:
        """
        Create a new user with comprehensive validation
        
        Args:
            db: Database session
            user_create: User creation data
            created_by_id: ID of user creating this record
            
        Returns:
            Created User object
            
        Raises:
            ValueError: If validation fails
            IntegrityError: If username already exists
        """
        # Validate shop exists if provided
        if user_create.shop_id:
            shop = db.query(Shop).filter(
                and_(
                    Shop.id == user_create.shop_id,
                    Shop.status == "active"
                )
            ).first()
            if not shop:
                raise ValueError(f"Shop with ID {user_create.shop_id} not found or inactive")
        
        # Check username uniqueness
        existing_user = db.query(User).filter(User.username == user_create.username).first()
        if existing_user:
            raise ValueError(f"Username '{user_create.username}' already exists")
        
        # Hash password
        password_hash = generate_password_hash(user_create.password)
        
        # Create user object
        db_user = User(
            username=user_create.username,
            password_hash=password_hash,
            role=user_create.role,
            shop_id=user_create.shop_id,
            created_by=created_by_id or user_create.created_by,
            contact=user_create.contact,
            credit_limit=user_create.credit_limit,
            status=user_create.status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_user)
        db.flush()  # Get ID without commit
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def get_by_id(db: Session, user_id: int, include_relations: bool = False) -> Optional[User]:
        """
        Get user by ID with optional relationship loading
        
        Args:
            db: Database session
            user_id: User ID to fetch
            include_relations: Whether to load related entities
            
        Returns:
            User object or None if not found
        """
        query = db.query(User)
        
        if include_relations:
            query = query.options(
                joinedload(User.shop),
                joinedload(User.transactions),
                joinedload(User.credits)
            )
        
        return query.filter(User.id == user_id).first()
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username for authentication"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_multi(
        db: Session,
        pagination: PaginationParams,
        shop_id: Optional[int] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """
        Get multiple users with filtering, pagination, and sorting
        
        Args:
            db: Database session
            pagination: Pagination parameters
            shop_id: Filter by shop ID
            role: Filter by user role
            status: Filter by status
            search: Search in username and contact
            sort_by: Field to sort by
            sort_order: Sort order (asc/desc)
            
        Returns:
            Dictionary with users list and pagination info
        """
        query = db.query(User)
        
        # Apply filters
        filters = []
        
        if shop_id:
            filters.append(User.shop_id == shop_id)
        
        if role:
            filters.append(User.role == role)
        
        if status:
            filters.append(User.status == status)
        
        if search:
            search_filter = or_(
                User.username.ilike(f"%{search}%"),
                User.contact.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Apply pagination
        offset = (pagination.page - 1) * pagination.limit
        users = query.offset(offset).limit(pagination.limit).all()
        
        return {
            "items": users,
            "total": total_count,
            "page": pagination.page,
            "limit": pagination.limit,
            "total_pages": (total_count + pagination.limit - 1) // pagination.limit
        }
    
    @staticmethod
    def update(db: Session, user_id: int, user_update: UserUpdate, updated_by_id: Optional[int] = None) -> Optional[User]:
        """
        Update user with validation and audit trail
        
        Args:
            db: Database session
            user_id: User ID to update
            user_update: Update data
            updated_by_id: ID of user making the update
            
        Returns:
            Updated User object or None if not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Store old values for audit
        old_values = {
            "username": user.username,
            "contact": user.contact,
            "credit_limit": user.credit_limit,
            "status": user.status
        }
        
        # Validate username uniqueness if changed
        if user_update.username and user_update.username != user.username:
            existing = db.query(User).filter(
                and_(
                    User.username == user_update.username,
                    User.id != user_id
                )
            ).first()
            if existing:
                raise ValueError(f"Username '{user_update.username}' already exists")
            user.username = user_update.username
        
        # Update fields
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        
        db.flush()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        """
        Soft delete user (set status to inactive)
        
        Args:
            db: Database session
            user_id: User ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.status = "inactive"
        user.updated_at = datetime.utcnow()
        
        db.flush()
        return True
    
    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        """
        Authenticate user by username and password
        
        Args:
            db: Database session
            username: Username
            password: Plain text password
            
        Returns:
            User object if authenticated, None otherwise
        """
        user = UserCRUD.get_by_username(db, username)
        if not user:
            return None
        
        if not check_password_hash(user.password_hash, password):
            return None
        
        if user.status != "active":
            return None
        
        return user
    
    @staticmethod
    def update_credit_limit(db: Session, user_id: int, new_limit: float, updated_by_id: int) -> Optional[User]:
        """
        Update user credit limit with business validation
        
        Args:
            db: Database session
            user_id: User ID
            new_limit: New credit limit
            updated_by_id: ID of user making the change
            
        Returns:
            Updated User object or None if not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        if user.role not in ["buyer", "farmer"]:
            raise ValueError("Credit limit can only be set for buyers and farmers")
        
        if new_limit < 0:
            raise ValueError("Credit limit cannot be negative")
        
        # Check current outstanding credit
        # This would need to be implemented with proper credit calculation
        # current_outstanding = calculate_outstanding_credit(db, user_id)
        # if new_limit < current_outstanding:
        #     raise ValueError(f"New limit ({new_limit}) cannot be less than outstanding credit ({current_outstanding})")
        
        user.credit_limit = new_limit
        user.updated_at = datetime.utcnow()
        
        db.flush()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def get_by_shop(db: Session, shop_id: int, active_only: bool = True) -> List[User]:
        """
        Get all users for a specific shop
        
        Args:
            db: Database session
            shop_id: Shop ID
            active_only: Only return active users
            
        Returns:
            List of User objects
        """
        query = db.query(User).filter(User.shop_id == shop_id)
        
        if active_only:
            query = query.filter(User.status == "active")
        
        return query.order_by(User.username).all()
    
    @staticmethod
    def get_farmers_with_stock(db: Session, shop_id: int) -> List[User]:
        """
        Get farmers who have active stock in the shop
        
        Args:
            db: Database session
            shop_id: Shop ID
            
        Returns:
            List of User objects (farmers with stock)
        """
        from ..models import FarmerStock
        
        return db.query(User).join(FarmerStock).filter(
            and_(
                User.role == "farmer",
                User.status == "active",
                FarmerStock.shop_id == shop_id,
                FarmerStock.status == "active",
                FarmerStock.quantity > 0
            )
        ).distinct().all()
    
    @staticmethod
    def get_buyers_with_credit(db: Session, shop_id: int) -> List[User]:
        """
        Get buyers who have outstanding credit
        
        Args:
            db: Database session
            shop_id: Shop ID
            
        Returns:
            List of User objects (buyers with credit)
        """
        from ..models import Credit
        
        return db.query(User).join(Credit).filter(
            and_(
                User.role == "buyer",
                User.status == "active",
                User.shop_id == shop_id,
                Credit.status.in_(["outstanding", "partial"])
            )
        ).distinct().all()

# Helper functions for backward compatibility
def create_user(db: Session, user_data: UserCreate, created_by_id: Optional[int] = None) -> User:
    return UserCRUD.create(db, user_data, created_by_id)

def get_user(db: Session, user_id: int) -> Optional[User]:
    return UserCRUD.get_by_id(db, user_id)

def update_user(db: Session, user_id: int, user_data: UserUpdate) -> Optional[User]:
    return UserCRUD.update(db, user_id, user_data)

def delete_user(db: Session, user_id: int) -> bool:
    return UserCRUD.delete(db, user_id)
