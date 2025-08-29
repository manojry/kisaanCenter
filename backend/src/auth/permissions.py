
from functools import wraps
from fastapi import HTTPException, status
from typing import List

PERMISSIONS = {
    "admin": ["*", "read", "write", "delete"],
    "editor": ["read", "write"],
    "viewer": ["read"],
    "moderator": ["read", "write", "moderate"]
}

def require_permissions(required_permissions: List[str]):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_permissions = get_user_permissions(current_user.role)
            
            if "*" not in user_permissions:
                for permission in required_permissions:
                    if permission not in user_permissions:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Permission denied: {permission}"
                        )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def get_user_permissions(role: str) -> List[str]:
    return PERMISSIONS.get(role, [])

from functools import wraps
from fastapi import HTTPException, status
from typing import List

def require_permissions(required_permissions: List[str]):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_permissions = get_user_permissions(current_user.role)
            
            if "*" not in user_permissions:
                for permission in required_permissions:
                    if permission not in user_permissions:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Permission denied: {permission}"
                        )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def get_user_permissions(role: str) -> List[str]:
    return PERMISSIONS.get(role, [])
