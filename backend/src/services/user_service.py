from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from ..schemas import UserCreate, UserUpdate, APIResponse, PaginationParams
from ..models import User, UserRole, RecordStatus
import hashlib
import logging

logger = logging.getLogger(__name__)

class UserService:
    @staticmethod
    def create_user(db: Session, user_data: UserCreate, created_by_id: Optional[int] = None) -> APIResponse:
        """Create user with comprehensive validation"""
        try:
            # Business validation
            if user_data.role != UserRole.SUPERADMIN and not user_data.shop_id:
                return APIResponse(success=False, message="Shop ID required for non-superadmin users")
            
            # Check username uniqueness
            existing_user = db.query(User).filter(User.username == user_data.username).first()
            if existing_user:
                return APIResponse(success=False, message="Username already exists")
            
            # Hash password
            password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
            
            # Create user
            user = User(
                username=user_data.username,
                password_hash=password_hash,
                role=user_data.role,
                shop_id=user_data.shop_id,
                contact=user_data.contact,
                credit_limit=user_data.credit_limit or 0,
                created_by=created_by_id,
                status=user_data.status
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            return APIResponse(
                success=True,
                message="User created successfully",
                data={"user_id": user.id, "username": user.username}
            )
            
        except IntegrityError as e:
            db.rollback()
            return APIResponse(success=False, message="Database constraint violation")
        except Exception as e:
            db.rollback()
            logger.error(f"User creation failed: {str(e)}")
            return APIResponse(success=False, message="Failed to create user")
    
    @staticmethod
    def get_user(db: Session, user_id: int, include_relations: bool = False) -> APIResponse:
        """Get user by ID with optional relations"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return APIResponse(success=False, message="User not found")
            
            user_data = {
                "id": user.id,
                "username": user.username,
                "role": user.role.value,
                "shop_id": user.shop_id,
                "contact": user.contact,
                "credit_limit": float(user.credit_limit) if user.credit_limit else 0,
                "status": user.status.value,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            }
            
            if include_relations:
                user_data["shop"] = user.shop.name if user.shop else None
                user_data["transaction_count"] = len(user.buyer_transactions)
                user_data["credit_count"] = len(user.credits_as_buyer)
            
            return APIResponse(success=True, data=user_data)
            
        except Exception as e:
            logger.error(f"Failed to get user {user_id}: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve user")
    
    @staticmethod
    def get_users(db: Session, pagination: PaginationParams, **filters) -> APIResponse:
        """Get paginated users with filtering"""
        try:
            query = db.query(User)
            
            # Apply filters
            if filters.get('shop_id'):
                query = query.filter(User.shop_id == filters['shop_id'])
            if filters.get('role'):
                query = query.filter(User.role == filters['role'])
            if filters.get('status'):
                query = query.filter(User.status == filters['status'])
            if filters.get('search'):
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    User.username.ilike(search_term) | 
                    User.contact.ilike(search_term)
                )
            
            # Get total count
            total = query.count()
            
            # Apply pagination and sorting
            sort_field = getattr(User, filters.get('sort_by', 'created_at'))
            if filters.get('sort_order') == 'asc':
                query = query.order_by(sort_field.asc())
            else:
                query = query.order_by(sort_field.desc())
            
            offset = (pagination.page - 1) * pagination.limit
            users = query.offset(offset).limit(pagination.limit).all()
            
            users_data = []
            for user in users:
                users_data.append({
                    "id": user.id,
                    "username": user.username,
                    "role": user.role.value,
                    "shop_id": user.shop_id,
                    "contact": user.contact,
                    "credit_limit": float(user.credit_limit) if user.credit_limit else 0,
                    "status": user.status.value,
                    "created_at": user.created_at.isoformat()
                })
            
            return APIResponse(
                success=True,
                data={
                    "items": users_data,
                    "total": total,
                    "page": pagination.page,
                    "limit": pagination.limit,
                    "total_pages": (total + pagination.limit - 1) // pagination.limit
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to get users: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve users")
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate, updated_by_id: Optional[int] = None) -> APIResponse:
        """Update user with validation"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return APIResponse(success=False, message="User not found")
            
            # Update fields
            if user_update.username:
                # Check uniqueness
                existing = db.query(User).filter(
                    User.username == user_update.username,
                    User.id != user_id
                ).first()
                if existing:
                    return APIResponse(success=False, message="Username already exists")
                user.username = user_update.username
            
            if user_update.contact is not None:
                user.contact = user_update.contact
            if user_update.credit_limit is not None:
                user.credit_limit = user_update.credit_limit
            if user_update.status is not None:
                user.status = user_update.status
            
            db.commit()
            
            return APIResponse(success=True, message="User updated successfully")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update user {user_id}: {str(e)}")
            return APIResponse(success=False, message="Failed to update user")
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> APIResponse:
        """Soft delete user"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return APIResponse(success=False, message="User not found")
            
            # Check if user has active transactions
            if user.buyer_transactions:
                active_transactions = [t for t in user.buyer_transactions if t.status.value == 'active']
                if active_transactions:
                    return APIResponse(
                        success=False, 
                        message="Cannot delete user with active transactions"
                    )
            
            user.status = RecordStatus.INACTIVE
            db.commit()
            
            return APIResponse(success=True, message="User deleted successfully")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete user {user_id}: {str(e)}")
            return APIResponse(success=False, message="Failed to delete user")
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> APIResponse:
        """Authenticate user credentials"""
        try:
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            user = db.query(User).filter(
                User.username == username,
                User.password_hash == password_hash,
                User.status == RecordStatus.ACTIVE
            ).first()
            
            if not user:
                return APIResponse(success=False, message="Invalid credentials")
            
            return APIResponse(
                success=True,
                message="Authentication successful",
                data={
                    "user_id": user.id,
                    "username": user.username,
                    "role": user.role.value,
                    "shop_id": user.shop_id
                }
            )
            
        except Exception as e:
            logger.error(f"Authentication failed for {username}: {str(e)}")
            return APIResponse(success=False, message="Authentication failed")