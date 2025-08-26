from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Product
from ..schemas import ProductCreate, ProductRead

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/", response_model=ProductRead)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # ...implement product creation...
    pass

@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    # ...implement get product by id...
    pass

@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    # ...implement update product...
    pass

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    # ...implement delete product...
    pass
