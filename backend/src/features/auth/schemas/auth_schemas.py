from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    """Login request schema"""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=8, max_length=100, description="Password")


class LoginResponse(BaseModel):
    """Login response schema"""
    user_id: int
    username: str
    role: str
    shop_id: Optional[int] = None


class AuthToken(BaseModel):
    """Authentication token schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_data: LoginResponse


class PasswordChangeRequest(BaseModel):
    """Password change request schema"""
    current_password: str = Field(..., min_length=8, max_length=100)
    new_password: str = Field(..., min_length=8, max_length=100)


class PasswordResetRequest(BaseModel):
    """Password reset request schema"""
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = Field(None, max_length=100)