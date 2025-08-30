from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.shop import Shop
from ....models import RecordStatus


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
            Shop.status == RecordStatus.ACTIVE
        ).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Shop]:
        """Get shop by name"""
        return db.query(Shop).filter(
            Shop.name == name,
            Shop.status == RecordStatus.ACTIVE
        ).first()
    
    @staticmethod
    def get_multi(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Dict[str, Any] = None
    ) -> List[Shop]:
        """Get multiple shops with optional filters"""
        query = db.query(Shop).filter(Shop.status == RecordStatus.ACTIVE)
        
        if filters:
            if 'name' in filters:
                query = query.filter(Shop.name.ilike(f"%{filters['name']}%"))
            if 'location' in filters:
                query = query.filter(Shop.location.ilike(f"%{filters['location']}%"))
            if 'status' in filters:
                query = query.filter(Shop.status == filters['status'])
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, shop_id: int, shop_data) -> Optional[Shop]:
        """Update shop"""
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            return None
        
        update_data = shop_data.model_dump(exclude_unset=True) if hasattr(shop_data, 'model_dump') else shop_data
        
        for field, value in update_data.items():
            setattr(shop, field, value)
        
        db.flush()
        return shop
    
    @staticmethod
    def delete(db: Session, shop_id: int) -> bool:
        """Soft delete shop by setting status to DELETED"""
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            return False
        
        shop.status = RecordStatus.DELETED
        db.flush()
        return True
    
    @staticmethod
    def get_shop_users(db: Session, shop_id: int) -> List[Dict]:
        """Get all users for a shop"""
        from ....models import User, RecordStatus  # Import here to avoid circular import
        
        users = db.query(User).filter(
            User.shop_id == shop_id,
            User.status == RecordStatus.ACTIVE
        ).all()
        
        return [user.to_dict() for user in users]
    
    @staticmethod
    def get_shop_products(db: Session, shop_id: int) -> List[Dict]:
        """Get all products for a shop"""
        from ....models import Product  # Import here to avoid circular import
        
        products = db.query(Product).filter(
            Product.shop_id == shop_id,
            Product.status == RecordStatus.ACTIVE
        ).all()
        
        return [product.to_dict() for product in products]
    
    @staticmethod
    def get_shop_analytics(db: Session, shop_id: int) -> Dict[str, Any]:
        """Get shop analytics"""
        from ....models import User, Product, Transaction  # Import here to avoid circular import
        
        # Count users
        user_count = db.query(User).filter(
            User.shop_id == shop_id,
            User.status == RecordStatus.ACTIVE
        ).count()
        
        # Count products
        product_count = db.query(Product).filter(
            Product.shop_id == shop_id,
            Product.status == RecordStatus.ACTIVE
        ).count()
        
        # Count transactions
        transaction_count = db.query(Transaction).filter(
            Transaction.shop_id == shop_id
        ).count()
        
        return {
            'shop_id': shop_id,
            'total_users': user_count,
            'total_products': product_count,
            'total_transactions': transaction_count,
            'analytics_date': datetime.now().isoformat()
        }
    
    @staticmethod
    def get_shops_by_owner(db: Session, owner_id: int) -> List[Shop]:
        """Get all shops owned by a specific user"""
        return db.query(Shop).filter(
            Shop.owner_user_id == owner_id,
            Shop.status == RecordStatus.ACTIVE
        ).all()
    
    @staticmethod
    def get_shops_by_plan(db: Session, plan_id: int) -> List[Shop]:
        """Get all shops with a specific plan"""
        return db.query(Shop).filter(
            Shop.plan_id == plan_id,
            Shop.status == RecordStatus.ACTIVE
        ).all()