from sqlalchemy.orm import Session
from typing import Optional
from ....models import User, RecordStatus
from ..services.auth_service import AuthService


class UserCRUD:
    """CRUD operations for User model"""
    
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(
            User.id == user_id,
            User.status == 'active'
        ).first()
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(
            User.username == username,
            User.status == 'active'
        ).first()
    
    @staticmethod
    def create_user(db: Session, user_data: dict) -> User:
        """Create a new user"""
        # Hash the password
        if 'password' in user_data:
            user_data['password_hash'] = AuthService.hash_password(user_data.pop('password'))
        
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: dict) -> Optional[User]:
        """Update user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Hash password if provided
        if 'password' in user_data:
            user_data['password_hash'] = AuthService.hash_password(user_data.pop('password'))
        
        for key, value in user_data.items():
            setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Soft delete user by setting status to DELETED"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.status = RecordStatus.DELETED
        db.commit()
        return True
    
    @staticmethod
    def get_users_by_shop(db: Session, shop_id: int) -> list[User]:
        """Get all active users for a shop"""
        return db.query(User).filter(
            User.shop_id == shop_id,
            User.status == 'active'
        ).all()
    
    @staticmethod
    def get_users_by_role(db: Session, role: str) -> list[User]:
        """Get all active users by role"""
        return db.query(User).filter(
            User.role == role,
            User.status == 'active'
        ).all()