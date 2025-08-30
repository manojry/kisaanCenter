from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

class PaginationParams(BaseModel):
    page: int = 1
    size: int = 20
    search: Optional[str] = None

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)  # Will be hashed to password_hash in service
    role: str = Field(..., max_length=20)
    # shop_id removed: owner does not need shop_id
    contact: Optional[str] = Field(None, max_length=15)
    credit_limit: Optional[Decimal] = Field(default=Decimal('0.00'))
    status: Optional[str] = Field(default="active", max_length=20)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    role: Optional[str] = Field(None, max_length=20)
    contact: Optional[str] = Field(None, max_length=15)
    credit_limit: Optional[Decimal] = None
    status: Optional[str] = Field(None, max_length=20)

class UserRead(BaseModel):
    id: int
    username: str
    role: str
    # shop_id removed: owner does not need shop_id
    contact: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserReadWithRelations(UserRead):
    """User read schema with relationship data"""
    shop: Optional[dict] = None
    transactions: Optional[list] = None
    credits: Optional[list] = None
