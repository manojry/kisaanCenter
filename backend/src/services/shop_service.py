from fastapi import APIRouter, Depends, Query, FastAPI
from sqlalchemy.orm import Session
from typing import Optional
from backend.src.database import get_db
from backend.src.models.shop import Shop
from backend.src.models.user import User
from backend.src.models.product import Product
from backend.src.schemas import APIResponse

router = APIRouter()

@router.get("/shops/{shop_id}/dashboard")
async def get_shop_dashboard(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Shop owner's main dashboard - today's summary"""
    # TODO: Replace with real summary logic
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    summary = {"shop_id": shop_id, "name": shop.name if shop else None, "today_sales": 0, "today_commission": 0}
    return APIResponse(success=True, data=summary)

@router.get("/shops/{shop_id}/users")
async def get_shop_users(
    shop_id: int,
    role: Optional[str] = Query(None),  # farmer, buyer
    db: Session = Depends(get_db)
):
    """Get all farmers and buyers for this shop"""
    query = db.query(User).filter(User.shop_id == shop_id)
    if role:
        query = query.filter(User.role == role)
    users = query.all()
    user_list = [{"id": u.id, "username": u.username, "role": u.role} for u in users]
    return APIResponse(success=True, data=user_list)

@router.get("/shops/{shop_id}/products")
async def get_shop_products(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get all products this shop can trade"""
    products = db.query(Product).filter(Product.shop_id == shop_id).all()
    product_list = [{"id": p.id, "name": p.name} for p in products]
    return APIResponse(success=True, data=product_list)
from sqlalchemy.orm import Session
from backend.src.models.shop import Shop
from backend.src.schemas import ShopCreateRequest, APIResponse

class ShopService:
    def __init__(self, db: Session):
        self.db = db

    def create_shop(self, shop_data: ShopCreateRequest) -> APIResponse:
        # TODO: Implement shop creation logic
        shop = Shop(**shop_data.dict())
        self.db.add(shop)
        self.db.commit()
        return APIResponse(success=True, message="Shop created successfully", data={"shop_id": shop.id})

    def activate_shop(self, shop_id: int) -> APIResponse:
        """Activate a shop by setting status to active"""
        try:
            shop = self.db.query(Shop).filter(Shop.id == shop_id).first()
            if not shop:
                return APIResponse(success=False, message="Shop not found")
            
            shop.status = "active"
            self.db.commit()
            return APIResponse(success=True, message="Shop activated successfully", data={"shop_id": shop_id})
        except Exception as e:
            self.db.rollback()
            return APIResponse(success=False, message=f"Error activating shop: {str(e)}")

app = FastAPI()
app.include_router(router)
