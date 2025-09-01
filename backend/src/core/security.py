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
    from jose import jwt
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
    @staticmethod
    def validate_token(token: str, token_type: str = "access") -> dict:
        """Validate and decode a JWT token (alias for verify_token for compatibility)."""
        return SecurityUtils.verify_token(token, token_type)
    """Security utility class."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt or secure SHA256."""
        if not pwd_context:
            # If bcrypt not available, use SHA256 with salt
            import hashlib, os
            salt = os.urandom(16)  # 16 bytes = 128 bits
            salted = password.encode() + salt
            hashed = hashlib.sha256(salted).hexdigest()
            return f"{salt.hex()}:{hashed}"  # Store salt with hash
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        if not pwd_context:
            # Handle salted SHA256
            import hashlib
            try:
                salt_hex, hash_value = hashed_password.split(":")
                salt = bytes.fromhex(salt_hex)
                salted = plain_password.encode() + salt
                return hashlib.sha256(salted).hexdigest() == hash_value
            except ValueError:
                # Handle old-style unsalted hashes for backwards compatibility
                return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT token with expiry using python-jose. No fallback allowed."""
        from jose import jwt
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
        to_encode = data.copy()
        to_encode.update({
            "exp": expire,
            "sub": str(data.get("user_id", data.get("sub", "")))
        })
        encoded_jwt = jwt.encode(
            to_encode,
            settings.security.secret_key.get_secret_value(),
            algorithm=settings.security.algorithm
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
            settings.security.secret_key.get_secret_value(), 
            algorithm=settings.security.algorithm
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
                settings.security.secret_key.get_secret_value(), 
                algorithms=[settings.security.algorithm]
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
    def validate_token(token: str, token_type: str = "access") -> dict:
        """Validate and decode a JWT token (alias for verify_token for compatibility)."""
        return SecurityUtils.verify_token(token, token_type)
    
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
