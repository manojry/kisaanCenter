from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import APIResponse
from ..services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=APIResponse)
def get_global_products(db: Session = Depends(get_db)):
    """Return global product catalog for all owners"""
    products = ProductService(db).get_all_products()
    return APIResponse(success=True, message="Global products listed", data=products)
