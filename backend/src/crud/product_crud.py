from typing import Optional, List
from sqlalchemy.orm import Session
from ..models import Product
from ..schemas import ProductCreate, ProductUpdate


class ProductCRUD:
    @staticmethod
    def create(db: Session, product_data: ProductCreate) -> 'Product':
        """
        Create a new product and initialize all required fields. Enforce business rules.
        """
        from ..models import Product, ProductStatus
        # Business rule: product name must not be empty
        if not product_data.name or not product_data.name.strip():
            raise ValueError("Product name is required")
        # Business rule: price must be positive
        if product_data.price is None or product_data.price <= 0:
            raise ValueError("Invalid product price")
        # Business rule: shop_id must be present
        if not getattr(product_data, 'shop_id', None):
            raise ValueError("shop_id is required")
        # TODO: Add inventory initialization logic if needed
        product = Product(
            name=product_data.name.strip(),
            description=getattr(product_data, 'description', None),
            price=product_data.price,
            shop_id=product_data.shop_id,
            status=getattr(product_data, 'status', ProductStatus.ACTIVE),
            created_at=getattr(product_data, 'created_at', None),
        )
        db.add(product)
        db.flush()  # Get product.id before commit
        # TODO: Handle inventory initialization if needed
        return product
    
    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        return db.query(Product).filter(Product.id == product_id).first()
    
    @staticmethod
    def get_by_shop_id(
        db: Session, 
        shop_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Product]:
        """Get products by shop ID with pagination"""
        return (
            db.query(Product)
            .filter(Product.shop_id == shop_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def search_products(
        db: Session,
        search_term: str,
        shop_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Product]:
        """Search products by name or description"""
        query = db.query(Product)
        
        if shop_id:
            query = query.filter(Product.shop_id == shop_id)
        
        # This is a basic search - in real implementation you might use full-text search
        query = query.filter(
            Product.name.ilike(f"%{search_term}%") | 
            Product.description.ilike(f"%{search_term}%")
        )
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update(
        db: Session, 
        product_id: int, 
        product_update: ProductUpdate
    ) -> Optional[Product]:
        """Update product"""
        # This is a stub implementation
        # In a real implementation, you would handle inventory updates carefully
        raise NotImplementedError("Product update not implemented yet")
    
    @staticmethod
    def delete(db: Session, product_id: int) -> bool:
        """Delete product"""
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            db.delete(product)
            db.commit()
            return True
        return False
    
    @staticmethod
    def count_by_shop(db: Session, shop_id: int) -> int:
        """Count products by shop"""
        return db.query(Product).filter(Product.shop_id == shop_id).count()
