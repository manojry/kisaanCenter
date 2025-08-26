"""
Shop API endpoints.

This module contains all shop-related API endpoints including:
- Shop creation and management
- Plan management
- Shop configuration
- Multi-tenant operations
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ...database import get_db
from ...core import get_current_user_id, require_roles

router = APIRouter()


@router.get("/shops")
async def get_shops(db: Session = Depends(get_db)):
    """Get list of shops."""
    return {"message": "Shop endpoints - coming soon"}


@router.post("/shops")
async def create_shop(db: Session = Depends(get_db)):
    """Create a new shop."""
    return {"message": "Create shop endpoint - coming soon"}
