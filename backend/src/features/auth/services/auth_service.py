import hashlib
import logging
from sqlalchemy.orm import Session
from typing import Optional

from ....models import User, Superadmin
from ....schemas import APIResponse
from ....models import RecordStatus

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service handling user login and validation"""
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> APIResponse:
        """Authenticate user credentials and generate tokens."""
        try:
            from ....core.security import SecurityUtils
            from datetime import timedelta
            
            # First check superadmin table
            superadmin = db.query(Superadmin).filter(
                Superadmin.username == username,
                Superadmin.status == RecordStatus.ACTIVE
            ).first()
            
            user = None
            if superadmin and SecurityUtils.verify_password(password, superadmin.password_hash):
                user_data = {
                    "user_id": superadmin.id,
                    "username": superadmin.username,
                    "role": "superadmin",
                    "shop_id": None
                }
            else:
                # Check user table
                user = db.query(User).filter(
                    User.username == username,
                    User.status == RecordStatus.ACTIVE
                ).first()
                
                if not user or not SecurityUtils.verify_password(password, user.password_hash):
                    return APIResponse(
                        success=False, 
                        message="Invalid credentials",
                        data=None
                    )
                    
                user_data = {
                    "user_id": user.id,
                    "username": user.username,
                    "role": user.role.value,
                    "shop_id": user.shop_id
                }
            
            # Generate tokens
            access_token = SecurityUtils.create_access_token(
                subject=user_data["user_id"],
                additional_claims=user_data,
                token_type="access"
            )
            
            refresh_token = SecurityUtils.create_access_token(
                subject=user_data["user_id"],
                expires_delta=timedelta(days=7),
                additional_claims={"token_type": "refresh"},
                token_type="refresh"
            )
            
            return APIResponse(
                success=True,
                message="Authentication successful",
                data={
                    **user_data,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer"
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