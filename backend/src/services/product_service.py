from sqlalchemy.orm import Session
from typing import List, Optional
from ..models import Product, RecordStatus

class ProductService:
    @staticmethod
    def get_products(db: Session, shop_id: int, skip: int = 0, limit: int = 100) -> List[Product]:
        try:
            return db.query(Product).filter(
                Product.shop_id == shop_id,
                Product.status == RecordStatus.ACTIVE
            ).offset(skip).limit(limit).all()
        except Exception:
            # Fallback without status filter if enum mismatch
            return db.query(Product).filter(
                Product.shop_id == shop_id
            ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()
    
    @staticmethod
    def create_product(db: Session, name: str, shop_id: int, category_id: int = None) -> Product:
        product = Product(
            name=name,
            shop_id=shop_id,
            category_id=category_id
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def update_product(db: Session, product_id: int, **kwargs) -> Optional[Product]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            for key, value in kwargs.items():
                if hasattr(product, key):
                    setattr(product, key, value)
            db.commit()
            db.refresh(product)
        return product
    
    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            product.status = RecordStatus.INACTIVE
            db.commit()
            return True
        return False