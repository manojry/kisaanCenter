
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.plan_schemas import PlanCreate, PlanRead # Assuming you create these Pydantic schemas
from ..services.plan_service import PlanService # Assuming you create this service

router = APIRouter(prefix="/plans", tags=["Plans"])

