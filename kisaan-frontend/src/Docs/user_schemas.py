from pydantic import BaseModel, Field
from typing import Optional

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: Optional[str] = None
    shop_id: Optional[int] = None
    contact: Optional[str] = None
    credit_limit: Optional[float] = 0.0

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    contact: Optional[str] = None
    credit_limit: Optional[float] = None

class UserRead(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    shop_id: Optional[int] = None
    contact: Optional[str] = None
    credit_limit: Optional[float] = None
    
    class Config:
        from_attributes = True

class UserReadWithRelations(UserRead):
    """User read schema with relationship data"""
    shop: Optional[dict] = None
    transactions: Optional[list] = None
    credits: Optional[list] = None
