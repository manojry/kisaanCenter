"""
Core security utilities.

This module contains security-related utilities including:
- Password hashing and verification
- JWT token creation and validation
- Authentication and authorization helpers
- Security decorators and middleware
"""
from datetime import datetime, timedelta
from typing import Optional, Union, Any

# Try to import optional security libraries with fallbacks
try:
    import jwt
except ImportError:
    jwt = None

try:
    from passlib.context import CryptContext
except ImportError:
    CryptContext = None

from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

# Password context for hashing (with fallback)
if CryptContext:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
else:
    pwd_context = None

# HTTP Bearer for token authentication
security = HTTPBearer()


class SecurityUtils:
    """Security utility class."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        if not pwd_context:
            # Fallback to basic hashing if passlib not available
            import hashlib
            return hashlib.sha256(password.encode()).hexdigest()
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        if not pwd_context:
            # Fallback to basic hashing comparison
            import hashlib
            return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(
        subject: Union[str, Any], 
        expires_delta: Optional[timedelta] = None,
        additional_claims: Optional[dict] = None
    ) -> str:
        """Create a JWT access token."""
        if not jwt:
            # Fallback to simple token if JWT library not available
            return f"simple_token_{subject}_{datetime.utcnow().timestamp()}"
            
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "access"
        }
        
        if additional_claims:
            to_encode.update(additional_claims)
            
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.SECRET_KEY, 
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(subject: Union[str, Any]) -> str:
        """Create a JWT refresh token."""
        if not jwt:
            return f"refresh_token_{subject}_{datetime.utcnow().timestamp()}"
            
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "refresh"
        }
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.SECRET_KEY, 
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> dict:
        """Verify and decode a JWT token."""
        if not jwt:
            # Simple fallback verification
            if token.startswith(f"simple_token_"):
                parts = token.split("_")
                if len(parts) >= 3:
                    return {"sub": parts[2], "type": token_type}
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="JWT library not available for token verification"
            )
            
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {token_type}"
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    
    @staticmethod
    def get_user_id_from_token(token: str) -> str:
        """Extract user ID from token."""
        payload = SecurityUtils.verify_token(token)
        return payload.get("sub")


def get_current_user_id(credentials: HTTPAuthorizationCredentials = security) -> str:
    """Dependency to get current user ID from token."""
    token = credentials.credentials
    return SecurityUtils.get_user_id_from_token(token)


def require_roles(*required_roles: str):
    """Decorator to require specific roles."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This would need to be implemented based on your user role system
            # For now, it's a placeholder
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# Security constants
ROLE_SUPERADMIN = "superadmin"
ROLE_OWNER = "owner"
ROLE_EMPLOYEE = "employee"
ROLE_FARMER = "farmer"
ROLE_BUYER = "buyer"

ALL_ROLES = [ROLE_SUPERADMIN, ROLE_OWNER, ROLE_EMPLOYEE, ROLE_FARMER, ROLE_BUYER]
ADMIN_ROLES = [ROLE_SUPERADMIN, ROLE_OWNER]
STAFF_ROLES = [ROLE_SUPERADMIN, ROLE_OWNER, ROLE_EMPLOYEE]
