"""
Schemas package for Market Management System

This package contains all Pydantic models for request/response validation
"""

# Import subscription schemas only (other schemas will be created as needed)
from .subscription_schemas import *

# Define basic schemas inline to avoid circular imports
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

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
