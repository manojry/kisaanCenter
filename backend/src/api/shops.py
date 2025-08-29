from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas import ShopCreate, ShopUpdate, ShopRead, APIResponse, PaginationParams
from ..services.shop_service import ShopService

router = APIRouter(prefix="/shops", tags=["Shops"])

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
                        "name": "Kisaan Mart",
                        "location": "Village Center",
                        "owner_id": 1,
                        "status": "active"
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Shop created successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Shop created.",
                            "data": {"shop_id": 101}
                        }
                    }
                }
            },
            "400": {"description": "Invalid input or business rule violation."}
        }
    }
)
def create_shop(shop: ShopCreate, db: Session = Depends(get_db)):
    result = ShopService.create_shop(db, shop)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{shop_id}", response_model=APIResponse)
@router.get(
    "/{shop_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "shop_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 101}}
        ],
        "responses": {
            "200": {
                "description": "Shop retrieved successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Shop retrieved.",
                            "data": {"shop": {"shop_id": 101, "name": "Kisaan Mart", "location": "Village Center", "owner_id": 1, "status": "active"}}
                        }
                    }
                }
            },
            "404": {"description": "Shop not found."}
        }
    }
)
def get_shop(shop_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = ShopService.get_shop(db, shop_id)
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
            {"name": "search", "in": "query", "required": False, "schema": {"type": "string", "example": "Kisaan"}},
            {"name": "status_filter", "in": "query", "required": False, "schema": {"type": "string", "example": "active"}}
        ],
        "responses": {
            "200": {
                "description": "List of shops.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Shops listed.",
                            "data": {
                                "shops": [
                                    {"shop_id": 101, "name": "Kisaan Mart", "location": "Village Center", "owner_id": 1, "status": "active"},
                                    {"shop_id": 102, "name": "Agro Store", "location": "Main Road", "owner_id": 2, "status": "inactive"}
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
def get_shops(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    result = ShopService.get_shops(db, pagination, search, status_filter)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put("/{shop_id}", response_model=APIResponse)
@router.put(
    "/{shop_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "shop_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 101}}
        ],
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "name": "Kisaan Mart Updated",
                        "location": "Village Center",
                        "status": "active"
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Shop updated successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Shop updated.",
                            "data": {"shop_id": 101, "name": "Kisaan Mart Updated", "location": "Village Center", "status": "active"}
                        }
                    }
                }
            },
            "404": {"description": "Shop not found."}
        }
    }
)
def update_shop(
    shop_id: int = Path(..., gt=0),
    shop_update: ShopUpdate = ...,
    db: Session = Depends(get_db)
):
    result = ShopService.update_shop(db, shop_id, shop_update)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.delete("/{shop_id}", response_model=APIResponse)
@router.delete(
    "/{shop_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "shop_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 101}}
        ],
        "responses": {
            "200": {
                "description": "Shop deleted successfully.",
                "content": {
                    "application/json": {
                        "example": {"success": True, "message": "Shop deleted."}
                    }
                }
            },
            "404": {"description": "Shop not found."}
        }
    }
)
def delete_shop(shop_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = ShopService.delete_shop(db, shop_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

# Business-specific
@router.get("/{shop_id}/stats", response_model=APIResponse)
def get_shop_stats(shop_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = ShopService.get_shop_stats(db, shop_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.put("/{shop_id}/commission-rate", response_model=APIResponse)
def update_commission_rate(
    shop_id: int = Path(..., gt=0),
    commission_rate: float = Query(..., ge=0, le=100),
    db: Session = Depends(get_db)
):
    result = ShopService.update_commission_rate(db, shop_id, commission_rate)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get("/{shop_id}/transactions", response_model=APIResponse)
def get_shop_transactions(
    shop_id: int = Path(..., gt=0),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    result = ShopService.get_shop_transactions(db, shop_id, pagination)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{shop_id}/users", response_model=APIResponse)
def get_shop_users(
    shop_id: int = Path(..., gt=0),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    result = ShopService.get_shop_users(db, shop_id, pagination)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result
