from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas import ShopCreate, ShopUpdate, ShopRead, APIResponse, PaginationParams
from ..services.shop_service import ShopService

router = APIRouter(prefix="/shops", tags=["Shops"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_shop(shop: ShopCreate, db: Session = Depends(get_db)):
    result = ShopService.create_shop(db, shop)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{shop_id}", response_model=APIResponse)
def get_shop(shop_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = ShopService.get_shop(db, shop_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get("/", response_model=APIResponse)
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
def delete_shop(shop_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = ShopService.delete_shop(db, shop_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result
