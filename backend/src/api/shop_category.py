from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.shop_category import ShopCategory
from ..models.shop import Shop
from ..models.category import Category
from ..schemas.shop_category_schemas import ShopCategoryCreate, ShopCategoryRead

router = APIRouter(prefix="/shop-categories", tags=["Shop Category Mapping"])

@router.post("/", response_model=ShopCategoryRead)
def assign_category_to_shop(data: ShopCategoryCreate, db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == data.shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    mapping = ShopCategory(shop_id=data.shop_id, category_id=data.category_id)
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping

@router.get("/shop/{shop_id}", response_model=list[ShopCategoryRead])
def get_categories_for_shop(shop_id: int, db: Session = Depends(get_db)):
    mappings = db.query(ShopCategory).filter(ShopCategory.shop_id == shop_id).all()
    return mappings
