from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ....database import get_db
from ....schemas import APIResponse
from ..services.auth_service import AuthService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login",
             response_model=APIResponse,
             summary="Authenticate user",
             description="Authenticate user credentials")
def login_user(
    username: str = Query(..., description="Username"),
    password: str = Query(..., description="Password"),
    db: Session = Depends(get_db)
):
    """
    Authenticate user credentials:
    
    - **username**: Valid username
    - **password**: User password
    - **Returns**: User data if authentication successful
    - **Security**: Password is hashed and verified securely
    """
    result = AuthService.authenticate_user(db, username, password)
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.message,
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return result


@router.post("/logout",
             response_model=APIResponse,
             summary="User logout",
             description="Logout user session")
def logout_user():
    """
    Logout user session:
    
    - **Returns**: Success message
    - **Note**: In a stateless JWT setup, logout is typically handled client-side
    """
    return APIResponse(
        success=True,
        message="Logout successful",
        data={"logged_out": True}
    )