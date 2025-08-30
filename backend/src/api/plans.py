
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.plan_schemas import PlanCreate, PlanRead # Assuming you create these Pydantic schemas
from ..services.plan_service import PlanService # Assuming you create this service

router = APIRouter(prefix="/plans", tags=["Plans"])

@router.post("/", response_model=PlanRead, status_code=201)
def create_plan(plan: PlanCreate, db: Session = Depends(get_db)):
    """
    Create a new subscription plan.
    """
    plan_service = PlanService(db)
    db_plan = plan_service.create_plan(plan)
    if not db_plan:
        raise HTTPException(status_code=400, detail="Plan could not be created.")
    return db_plan

@router.get("/", response_model=List[PlanRead])
def get_plans(db: Session = Depends(get_db)):
    """
    Retrieve all available plans.
    """
    plan_service = PlanService(db)
    return plan_service.get_all_plans()
