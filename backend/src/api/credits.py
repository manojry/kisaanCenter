from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import CreditCreate, CreditUpdate, APIResponse, PaginationParams
from ..services.credit_service import CreditService

router = APIRouter(prefix="/credits", tags=["Credits"])

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
                        "user_id": 1,
                        "amount": 1000.0,
                        "reason": "Initial credit for farmer registration"
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Credit created successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Credit created.",
                            "data": {"credit_id": 123}
                        }
                    }
                }
            },
            "400": {
                "description": "Invalid input or business rule violation."
            }
        }
    }
)
def create_credit(credit: CreditCreate, db: Session = Depends(get_db)):
    # TODO: Extract user_role from auth/session (stub: use SUPERADMIN)
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.create_credit(db, credit, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{credit_id}", response_model=APIResponse)
@router.get(
    "/{credit_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {
                "name": "credit_id",
                "in": "path",
                "required": True,
                "schema": {"type": "integer", "example": 123}
            }
        ],
        "responses": {
            "200": {
                "description": "Credit retrieved successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Credit retrieved.",
                            "data": {"credit": {"credit_id": 123, "user_id": 1, "amount": 1000.0, "reason": "Initial credit for farmer registration"}}
                        }
                    }
                }
            },
            "404": {"description": "Credit not found."}
        }
    }
)
def get_credit(credit_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.get_credit(db, credit_id, user_role=user_role)
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
            {"name": "limit", "in": "query", "required": False, "schema": {"type": "integer", "example": 10}}
        ],
        "responses": {
            "200": {
                "description": "List of credits.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Credits listed.",
                            "data": {
                                "credits": [
                                    {"credit_id": 123, "user_id": 1, "amount": 1000.0, "reason": "Initial credit for farmer registration"},
                                    {"credit_id": 124, "user_id": 2, "amount": 500.0, "reason": "Referral bonus"}
                                ],
                                "pagination": {"page": 1, "limit": 10, "total": 2}
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_credits(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.get_credits(db, pagination, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put("/{credit_id}", response_model=APIResponse)
@router.put(
    "/{credit_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "credit_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 123}}
        ],
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "amount": 1200.0,
                        "reason": "Correction after review"
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Credit updated successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Credit updated.",
                            "data": {"credit_id": 123, "amount": 1200.0, "reason": "Correction after review"}
                        }
                    }
                }
            },
            "404": {"description": "Credit not found."}
        }
    }
)
def update_credit(
    credit_id: int = Path(..., gt=0),
    credit_update: CreditUpdate = ...,
    db: Session = Depends(get_db)
):
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.update_credit(db, credit_id, credit_update, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.delete("/{credit_id}", response_model=APIResponse)
@router.delete(
    "/{credit_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "credit_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 123}}
        ],
        "responses": {
            "200": {
                "description": "Credit deleted successfully.",
                "content": {
                    "application/json": {
                        "example": {"success": True, "message": "Credit deleted."}
                    }
                }
            },
            "404": {"description": "Credit not found."}
        }
    }
)
def delete_credit(credit_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.delete_credit(db, credit_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

# Business-specific endpoints
@router.get("/user/{user_id}", response_model=APIResponse)
def get_user_credits(user_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.get_user_credits(db, user_id, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result

@router.get("/shop/{shop_id}", response_model=APIResponse)
def get_shop_credits(shop_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.get_shop_credits(db, shop_id, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result

@router.get("/overdue", response_model=APIResponse)
def get_overdue_credits(db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.get_overdue_credits(db, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put("/{credit_id}/payment", response_model=APIResponse)
def record_payment(credit_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = CreditService.record_payment(db, credit_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result
