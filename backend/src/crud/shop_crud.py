from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import Optional, Dict, Any
from ..models import Shop
from ..api.schemas import ShopCreate, ShopUpdate, PaginationParams
from datetime import datetime

class ShopCRUD:
    """Enterprise-level CRUD operations for Shop entity"""
    
    @staticmethod
    def create(db: Session, shop_create: ShopCreate) -> Shop:
        """Create a new shop"""
        # Check name uniqueness
        existing_shop = db.query(Shop).filter(Shop.name == shop_create.name).first()
        if existing_shop:
            raise ValueError(f"Shop name '{shop_create.name}' already exists")
        
        db_shop = Shop(
            name=shop_create.name,
            location=shop_create.location,
            plan_id=shop_create.plan_id,
            created_by=shop_create.created_by,
            status=shop_create.status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_shop)
        db.flush()
        db.refresh(db_shop)
        return db_shop
    
    @staticmethod
    def get_by_id(db: Session, shop_id: int) -> Optional[Shop]:
        """Get shop by ID"""
        return db.query(Shop).filter(Shop.id == shop_id).first()
    
    @staticmethod
    def get_multi(
        db: Session,
        pagination: PaginationParams,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get multiple shops with filtering"""
        query = db.query(Shop)
        
        # Apply filters
        filters = []
        
        if status_filter:
            filters.append(Shop.status == status_filter)
        
        if search:
            search_filter = or_(
                Shop.name.ilike(f"%{search}%"),
                Shop.location.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        if filters:
            query = query.filter(and_(*filters))
        
        total_count = query.count()
        
        # Apply pagination
        offset = (pagination.page - 1) * pagination.limit
        shops = query.order_by(desc(Shop.created_at)).offset(offset).limit(pagination.limit).all()
        
        return {
            "items": shops,
            "total": total_count,
            "page": pagination.page,
            "limit": pagination.limit,
            "total_pages": (total_count + pagination.limit - 1) // pagination.limit
        }
    
    @staticmethod
    def update(db: Session, shop_id: int, shop_update: ShopUpdate) -> Optional[Shop]:
        """Update shop"""
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            return None
        
        # Check name uniqueness if changed
        if shop_update.name and shop_update.name != shop.name:
            existing = db.query(Shop).filter(
                and_(Shop.name == shop_update.name, Shop.id != shop_id)
            ).first()
            if existing:
                raise ValueError(f"Shop name '{shop_update.name}' already exists")
        
        # Update fields
        update_data = shop_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(shop, field) and value is not None:
                setattr(shop, field, value)
        
        shop.updated_at = datetime.utcnow()
        db.flush()
        db.refresh(shop)
        return shop
    
    @staticmethod
    def delete(db: Session, shop_id: int) -> bool:
        """Soft delete shop"""
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            return False
        
        shop.status = "inactive"
        shop.updated_at = datetime.utcnow()
        db.flush()
        return True

# Helper functions for backward compatibility
def create_shop(db: Session, shop_data: ShopCreate) -> Shop:
    return ShopCRUD.create(db, shop_data)

def get_shop(db: Session, shop_id: int) -> Optional[Shop]:
    return ShopCRUD.get_by_id(db, shop_id)

def update_shop(db: Session, shop_id: int, shop_data: ShopUpdate) -> Optional[Shop]:
    return ShopCRUD.update(db, shop_id, shop_data)

def delete_shop(db: Session, shop_id: int) -> bool:
    return ShopCRUD.delete(db, shop_id)
