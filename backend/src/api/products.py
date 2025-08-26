from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ProductCreate, ProductUpdate, APIResponse, PaginationParams
from ..services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # TODO: Extract user_role from auth/session (stub: use SUPERADMIN)
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.create_product(db, product, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{product_id}", response_model=APIResponse)
def get_product(product_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.get_product(db, product_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get("/", response_model=APIResponse)
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.get_products(db, pagination, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put("/{product_id}", response_model=APIResponse)
def update_product(
    product_id: int = Path(..., gt=0),
    product_update: ProductUpdate = ...,
    db: Session = Depends(get_db)
):
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.update_product(db, product_id, product_update, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.delete("/{product_id}", response_model=APIResponse)
def delete_product(product_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.delete_product(db, product_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result
