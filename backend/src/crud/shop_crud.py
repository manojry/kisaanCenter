from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models import Shop, User, Product
from ..schemas import PaginationParams


class ShopCRUD:
    """CRUD operations for Shop model"""
    
    @staticmethod
    def create(db: Session, shop_data) -> Shop:
        """Create a new shop"""
        shop_dict = shop_data.model_dump() if hasattr(shop_data, 'model_dump') else shop_data
        shop = Shop(**shop_dict)
        db.add(shop)
        db.flush()  # Get the ID without committing
        return shop
    
    @staticmethod
    def get_by_id(db: Session, shop_id: int) -> Optional[Shop]:
        """Get shop by ID"""
        return db.query(Shop).filter(
            Shop.id == shop_id,
            Shop.status == 'active'
        ).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Shop]:
        """Get shop by name"""
        return db.query(Shop).filter(
            Shop.name == name,
            Shop.status == 'active'
        ).first()
    
    @staticmethod
    def get_multi(
        db: Session, 
        pagination: PaginationParams, 
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get multiple shops with pagination and optional filters"""
        query = db.query(Shop).filter(Shop.status == 'active')
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Shop.name.ilike(search_term),
                    Shop.location.ilike(search_term),
                    Shop.contact.ilike(search_term)
                )
            )
        
        # Apply status filter
        if status_filter:
            status_lower = status_filter.lower()
            query = query.filter(Shop.status == status_lower)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        skip = (pagination.page - 1) * pagination.limit
        shops = query.offset(skip).limit(pagination.limit).all()
        
        return {
            "items": shops,
            "total": total_count,
            "page": pagination.page,
            "limit": pagination.limit,
            "total_pages": (total_count + pagination.limit - 1) // pagination.limit
        }
    
    @staticmethod
    def update(db: Session, shop_id: int, shop_data) -> Optional[Shop]:
        """Update shop"""
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            return None
        
        update_data = shop_data.model_dump(exclude_unset=True) if hasattr(shop_data, 'model_dump') else shop_data
        
        for field, value in update_data.items():
            setattr(shop, field, value)
        
        shop.updated_at = datetime.utcnow()
        db.flush()
        return shop
    
    @staticmethod
    def delete(db: Session, shop_id: int) -> bool:
        """Soft delete shop by setting status to inactive"""
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            return False
        
        shop.status = 'inactive'
        shop.updated_at = datetime.utcnow()
        db.flush()
        return True
    
    @staticmethod
    def get_shop_users(db: Session, shop_id: int) -> List[User]:
        """Get all users for a shop"""
        return db.query(User).filter(
            User.shop_id == shop_id,
            User.status == 'active'
        ).all()
    
    @staticmethod
    def get_shop_products(db: Session, shop_id: int) -> List[Product]:
        """Get all products for a shop"""
        return db.query(Product).filter(
            Product.shop_id == shop_id,
            Product.status == 'active'
        ).all()
    
    @staticmethod
    def get_shop_analytics(db: Session, shop_id: int) -> Dict[str, Any]:
        """Get shop analytics data"""
        from sqlalchemy import func
        from ..models import Transaction, FarmerStock
        
        # Get basic counts
        user_count = db.query(func.count(User.id)).filter(
            User.shop_id == shop_id,
            User.status == 'active'
        ).scalar() or 0
        
        product_count = db.query(func.count(Product.id)).filter(
            Product.shop_id == shop_id,
            Product.status == 'active'
        ).scalar() or 0
        
        transaction_count = db.query(func.count(Transaction.id)).filter(
            Transaction.shop_id == shop_id
        ).scalar() or 0
        
        stock_count = db.query(func.count(FarmerStock.id)).filter(
            FarmerStock.shop_id == shop_id
        ).scalar() or 0
        
        return {
            "user_count": user_count,
            "product_count": product_count,
            "transaction_count": transaction_count,
            "stock_count": stock_count
        }
