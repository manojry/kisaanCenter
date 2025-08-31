from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import APIResponse
from ..models.user import User
from ..features.auth.services.auth_service import AuthService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login",
             response_model=APIResponse,
             summary="Authenticate user and get access token",
             description="Authenticate user credentials and return JWT token")
def login_user(
    username: str = Query(..., description="Username"),
    password: str = Query(..., description="Password"),
    db: Session = Depends(get_db)
):
    """
    Authenticate user credentials and get access token:
    
    - **username**: Valid username
    - **password**: User password
    - **Returns**: User data with access and refresh tokens
    """
    result = AuthService.authenticate_user(db, username, password)
    return result

@router.post("/refresh", response_model=APIResponse)
def refresh_token(
    refresh_token: str = Query(..., description="Refresh token"),
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    from ..core.security import SecurityUtils
    try:
        # Validate refresh token
        token_data = SecurityUtils.validate_token(refresh_token)
        if token_data.get("token_type") != "refresh":
            return APIResponse(success=False, message="Invalid refresh token")
        
        # Get user data
        user = AuthService.get_user_by_id(db, token_data["sub"])
        if not user:
            return APIResponse(success=False, message="User not found")
        
        # Generate new access token
        user_data = {
            "user_id": user.id,
            "username": user.username,
            "role": user.role.value,
            "shop_id": user.shop_id
        }
        
        access_token = SecurityUtils.create_access_token(
            subject=user_data["user_id"],
            additional_claims=user_data,
            token_type="access"
        )
        
        return APIResponse(
            success=True,
            message="Token refreshed successfully",
            data={
                "access_token": access_token,
                "token_type": "bearer"
            }
        )
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}")
        return APIResponse(success=False, message="Token refresh failed")
