"""
Schemas package for Market Management System

This package contains all Pydantic models for request/response validation
"""

from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

# Define enums to avoid circular imports
class UserRoleEnum(str, Enum):
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    FARMER = "farmer"
    BUYER = "buyer"
    EMPLOYEE = "employee"

class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 10

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None

# Base schema classes
class BaseSchema(BaseModel):
    """Base schema for all models"""
    pass

class TimestampMixin(BaseModel):
    """Mixin for timestamp fields"""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Import user schemas
from .user_schemas import UserCreate

# Import shop schemas
from .shop_schemas import ShopCreate

# Add missing schema classes that are referenced in API modules
class ShopUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None

# Import subscription schemas if available
try:
    from .subscription_schemas import *
except ImportError:
    pass

# Import plan schemas if available  
try:
    from .plan_schemas import *
except ImportError:
    pass