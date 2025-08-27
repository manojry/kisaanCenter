from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional
from ....database import get_db
from ....schemas import ShopCreate, ShopUpdate, ShopRead, APIResponse, PaginationParams
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
    """Create a new shop"""
    result = ShopService.create_shop(db, shop)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result


@router.get("/{shop_id}", response_model=APIResponse)
def get_shop(
    shop_id: int = Path(..., description="Shop ID"),
    db: Session = Depends(get_db)
):
    """Get shop by ID"""
    result = ShopService.get_shop(db, shop_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/", response_model=APIResponse)
def get_shops(
    pagination: PaginationParams = Depends(),
    name: Optional[str] = Query(None, description="Filter by shop name"),
    location: Optional[str] = Query(None, description="Filter by location"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """Get all shops with optional filtering"""
    filters = {}
    if name:
        filters['name'] = name
    if location:
        filters['location'] = location
    if status:
        filters['status'] = status
    
    result = ShopService.get_shops(db, pagination, filters)
    return result


@router.put("/{shop_id}", response_model=APIResponse)
def update_shop(
    shop_id: int = Path(..., description="Shop ID"),
    shop_update: ShopUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update shop"""
    result = ShopService.update_shop(db, shop_id, shop_update)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.delete("/{shop_id}", response_model=APIResponse)
def delete_shop(
    shop_id: int = Path(..., description="Shop ID"),
    db: Session = Depends(get_db)
):
    """Delete shop (soft delete)"""
    result = ShopService.delete_shop(db, shop_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/{shop_id}/users", response_model=APIResponse)
def get_shop_users(
    shop_id: int = Path(..., description="Shop ID"),
    db: Session = Depends(get_db)
):
    """Get all users for a shop"""
    result = ShopService.get_shop_users(db, shop_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/{shop_id}/products", response_model=APIResponse)
def get_shop_products(
    shop_id: int = Path(..., description="Shop ID"),
    db: Session = Depends(get_db)
):
    """Get all products for a shop"""
    result = ShopService.get_shop_products(db, shop_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/{shop_id}/analytics", response_model=APIResponse)
def get_shop_analytics(
    shop_id: int = Path(..., description="Shop ID"),
    db: Session = Depends(get_db)
):
    """Get shop analytics"""
    result = ShopService.get_shop_analytics(db, shop_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result