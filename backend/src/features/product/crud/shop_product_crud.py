
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from src.features.product.models.shop_product import ShopProduct
from src.core.crud_base import CRUDBase

class ShopProductCRUD(CRUDBase[ShopProduct]):
    
    @staticmethod
    def get_by_shop_id(db: Session, shop_id: int) -> List[ShopProduct]:
        """Get all products for a specific shop"""
        return db.query(ShopProduct).options(
            joinedload(ShopProduct.product).joinedload(ShopProduct.product.category)
        ).filter(
            ShopProduct.shop_id == shop_id,
            ShopProduct.is_active == True
        ).all()
    
    @staticmethod
    def get_by_shop_and_product(db: Session, shop_id: int, product_id: int) -> Optional[ShopProduct]:
        """Get specific shop product"""
        return db.query(ShopProduct).filter(
            ShopProduct.shop_id == shop_id,
            ShopProduct.product_id == product_id,
            ShopProduct.is_active == True
        ).first()
    
    @staticmethod
    def get_products_with_details(db: Session, shop_id: int) -> List[Dict[str, Any]]:
        """Get products with detailed information for a specific shop"""
        query = db.query(ShopProduct).options(
            joinedload(ShopProduct.product).joinedload(ShopProduct.product.category)
        ).filter(
            ShopProduct.shop_id == shop_id,
            ShopProduct.is_active == True
        )
        
        results = []
        for item in query.all():
            product_data = {
                'id': item.id,
                'shop_id': item.shop_id,
                'product_id': item.product_id,
                'price': item.price,
                'stock_quantity': item.stock_quantity,
                'is_active': item.is_active,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                    'description': item.product.description,
                    'category': {
                        'id': item.product.category.id if item.product.category else None,
                        'name': item.product.category.name if item.product.category else None
                    } if item.product.category else None
                }
            }
            results.append(product_data)
        
        return results
    
    @staticmethod
    def create(db: Session, obj_in: Dict[str, Any]) -> ShopProduct:
        """Create a new shop product"""
        db_obj = ShopProduct(**obj_in)
        db.add(db_obj)
        db.flush()
        return db_obj
    
    @staticmethod
    def update(db: Session, db_obj: ShopProduct, obj_in: Dict[str, Any]) -> ShopProduct:
        """Update shop product"""
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.flush()
        return db_obj
    
    @staticmethod
    def delete_by_shop_id(db: Session, shop_id: int) -> int:
        """Soft delete all products for a shop"""
        count = db.query(ShopProduct).filter(
            ShopProduct.shop_id == shop_id
        ).update({"is_active": False})
        db.flush()
        return count
    
    @staticmethod
    def get_by_id(db: Session, shop_product_id: int) -> Optional[ShopProduct]:
        """Get shop product by ID"""
        return db.query(ShopProduct).options(
            joinedload(ShopProduct.product).joinedload(ShopProduct.product.category)
        ).filter(
            ShopProduct.id == shop_product_id,
            ShopProduct.is_active == True
        ).first()
    
    @staticmethod
    def bulk_create(db: Session, shop_id: int, product_data: List[Dict[str, Any]]) -> List[ShopProduct]:
        """Bulk create shop products"""
        shop_products = []
        for data in product_data:
            data['shop_id'] = shop_id
            shop_product = ShopProduct(**data)
            db.add(shop_product)
            shop_products.append(shop_product)
        
        db.flush()
        return shop_products
    
    @staticmethod
    def get_available_for_farmer(db: Session, shop_id: int) -> List[ShopProduct]:
        """Get products available for farmer assignment"""
        return db.query(ShopProduct).options(
            joinedload(ShopProduct.product).joinedload(ShopProduct.product.category)
        ).filter(
            ShopProduct.shop_id == shop_id,
            ShopProduct.is_active == True,
            ShopProduct.is_available == True
        ).all()
