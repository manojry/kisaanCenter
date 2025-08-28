from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
from ..database import get_db
from ..schemas.plan_schemas import PlanCreate, PlanUpdate, PlanRead, PlanAnalytics
from ..schemas import APIResponse, PaginationParams
from ..services.plan_service import PlanService

router = APIRouter(prefix="/plans", tags=["Plans"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
@router.post(
    "/",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "name": "Basic Plan",
                        "description": "Basic subscription plan for small shops",
                        "monthly_price": 99.99,
                        "max_farmers": 10,
                        "max_buyers": 20,
                        "max_transactions": 1000,
                        "data_retention_months": 6,
                        "features": {
                            "inventory_management": True,
                            "basic_analytics": True,
                            "customer_support": False
                        }
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Plan created successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Plan created successfully",
                            "data": {"id": 1, "name": "Basic Plan", "monthly_price": 99.99}
                        }
                    }
                }
            },
            "400": {"description": "Invalid input or business rule violation."}
        }
    }
)
def create_plan(plan: PlanCreate, db: Session = Depends(get_db)):
    """Create a new subscription plan"""
    result = PlanService.create_plan(db, plan)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{plan_id}", response_model=APIResponse)
@router.get(
    "/{plan_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "plan_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 1}}
        ],
        "responses": {
            "200": {
                "description": "Plan retrieved successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Plan retrieved successfully",
                            "data": {
                                "id": 1,
                                "name": "Basic Plan",
                                "description": "Basic subscription plan",
                                "monthly_price": 99.99,
                                "quarterly_price": 284.97,
                                "yearly_price": 1019.89,
                                "max_farmers": 10,
                                "max_buyers": 20,
                                "max_transactions": 1000,
                                "data_retention_months": 6,
                                "status": "active"
                            }
                        }
                    }
                }
            },
            "404": {"description": "Plan not found."}
        }
    }
)
def get_plan(plan_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """Get plan by ID"""
    result = PlanService.get_plan(db, plan_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get("/", response_model=APIResponse)
@router.get(
    "/",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "page", "in": "query", "required": False, "schema": {"type": "integer", "example": 1}},
            {"name": "limit", "in": "query", "required": False, "schema": {"type": "integer", "example": 10}},
            {"name": "search", "in": "query", "required": False, "schema": {"type": "string", "example": "Basic"}},
            {"name": "price_min", "in": "query", "required": False, "schema": {"type": "number", "example": 50.0}},
            {"name": "price_max", "in": "query", "required": False, "schema": {"type": "number", "example": 200.0}}
        ],
        "responses": {
            "200": {
                "description": "List of plans.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Plans retrieved successfully",
                            "data": {
                                "items": [
                                    {
                                        "id": 1,
                                        "name": "Basic Plan",
                                        "monthly_price": 99.99,
                                        "max_farmers": 10,
                                        "max_buyers": 20,
                                        "status": "active"
                                    }
                                ],
                                "pagination": {"page": 1, "limit": 10, "total": 1}
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_plans(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    price_min: Optional[Decimal] = Query(None, ge=0),
    price_max: Optional[Decimal] = Query(None, ge=0),
    db: Session = Depends(get_db)
):
    """Get all plans with filtering and pagination"""
    pagination = PaginationParams(page=page, limit=limit)
    result = PlanService.get_plans(db, pagination, search, price_min, price_max)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put("/{plan_id}", response_model=APIResponse)
@router.put(
    "/{plan_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "plan_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 1}}
        ],
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "name": "Basic Plan Updated",
                        "description": "Updated basic subscription plan",
                        "monthly_price": 109.99,
                        "max_farmers": 15
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Plan updated successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Plan updated successfully",
                            "data": {"id": 1, "name": "Basic Plan Updated", "monthly_price": 109.99}
                        }
                    }
                }
            },
            "404": {"description": "Plan not found."}
        }
    }
)
def update_plan(
    plan_id: int = Path(..., gt=0),
    plan_update: PlanUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update plan"""
    result = PlanService.update_plan(db, plan_id, plan_update)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.delete("/{plan_id}", response_model=APIResponse)
@router.delete(
    "/{plan_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "plan_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 1}}
        ],
        "responses": {
            "200": {
                "description": "Plan deleted successfully.",
                "content": {
                    "application/json": {
                        "example": {"success": True, "message": "Plan deleted successfully"}
                    }
                }
            },
            "400": {"description": "Cannot delete plan with active shops."},
            "404": {"description": "Plan not found."}
        }
    }
)
def delete_plan(plan_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """Delete plan (soft delete)"""
    result = PlanService.delete_plan(db, plan_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get("/{plan_id}/analytics", response_model=APIResponse)
@router.get(
    "/{plan_id}/analytics",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "plan_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 1}}
        ],
        "responses": {
            "200": {
                "description": "Plan analytics retrieved successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Plan analytics retrieved successfully",
                            "data": {
                                "plan_id": 1,
                                "plan_name": "Basic Plan",
                                "total_shops": 5,
                                "total_active_subscriptions": 3,
                                "monthly_revenue": 299.97,
                                "analytics_date": "2024-01-15T10:30:00"
                            }
                        }
                    }
                }
            },
            "404": {"description": "Plan not found."}
        }
    }
)
def get_plan_analytics(plan_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """Get plan analytics"""
    result = PlanService.get_plan_analytics(db, plan_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get("/analytics/popular", response_model=APIResponse)
@router.get(
    "/analytics/popular",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "limit", "in": "query", "required": False, "schema": {"type": "integer", "example": 5}}
        ],
        "responses": {
            "200": {
                "description": "Popular plans retrieved successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Popular plans retrieved successfully",
                            "data": {
                                "popular_plans": [
                                    {
                                        "plan": {"id": 1, "name": "Basic Plan", "monthly_price": 99.99},
                                        "shop_count": 5
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_popular_plans(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Get most popular plans"""
    result = PlanService.get_popular_plans(db, limit)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result