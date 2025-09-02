"""
Authorization utilities for role-based access control
"""

from functools import wraps
from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional, Callable

from ..database import get_db
from ..models import User, UserRole


def get_current_user(db: Session = Depends(get_db), user_id: Optional[int] = None) -> User:
    """
    Get current authenticated user. 
    In a real implementation, this would extract user from JWT token.
    For now, we'll use a placeholder.
    """
    if not user_id:
        # In real implementation, extract from JWT token
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_roles(allowed_roles: List[UserRole]):
    """
    Decorator to require specific roles for endpoint access
    Usage: @require_roles([UserRole.superadmin, UserRole.owner])
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current user from request context
            # In real implementation, this would come from JWT middleware
            current_user = kwargs.get('current_user')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_superadmin(func: Callable):
    """Decorator to require superadmin role"""
    return require_roles([UserRole.superadmin])(func)


def require_owner_or_superadmin(func: Callable):
    """Decorator to require owner or superadmin role"""
    return require_roles([UserRole.owner, UserRole.superadmin])(func)


def validate_owner_access(current_user: User, shop_id: int, db: Session):
    """
    Validate that owner can only access their own shop
    """
    if current_user.role == UserRole.superadmin:
        return True  # Superadmin can access any shop
    
    if current_user.role == UserRole.owner:
        # Check if this owner is associated with the shop
        if current_user.shop_id == shop_id:
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only manage your own shop."
        )
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. Owner or superadmin role required."
    )


def validate_user_creation_access(current_user: User, role: str, shop_id: Optional[int] = None):
    """
    Validate user creation permissions based on current user role
    """
    if current_user.role == UserRole.superadmin:
        return True  # Superadmin can create any user
    
    if current_user.role == UserRole.owner:
        # Owner can create farmers, buyers, employees for their shop only
        if role in ['farmer', 'buyer', 'employee']:
            if shop_id and shop_id == current_user.shop_id:
                return True
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create users for your own shop"
            )
        
        if role == 'owner':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only superadmin can create owners"
            )
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions to create users"
    )
