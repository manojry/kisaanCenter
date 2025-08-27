import hashlib
import logging
from sqlalchemy.orm import Session
from typing import Optional

from ....models import User
from ....schemas import APIResponse
from ....models import RecordStatus

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service handling user login and validation"""
    
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
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return hashlib.sha256(password.encode()).hexdigest() == password_hash
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get active user by ID"""
        return db.query(User).filter(
            User.id == user_id,
            User.status == RecordStatus.ACTIVE
        ).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get active user by username"""
        return db.query(User).filter(
            User.username == username,
            User.status == RecordStatus.ACTIVE
        ).first()