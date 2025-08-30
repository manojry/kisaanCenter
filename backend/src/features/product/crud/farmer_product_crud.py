
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from src.features.product.models.farmer_product import FarmerProduct
from src.core.crud_base import CRUDBase

class FarmerProductCRUD(CRUDBase[FarmerProduct]):
    
    @staticmethod
    def get_by_farmer_id(db: Session, farmer_id: int) -> List[FarmerProduct]:
        """Get all products assigned to a farmer"""
        return db.query(FarmerProduct).options(
            joinedload(FarmerProduct.shop_product).joinedload(FarmerProduct.shop_product.product).joinedload(FarmerProduct.shop_product.product.category)
        ).filter(
            FarmerProduct.farmer_id == farmer_id,
            FarmerProduct.is_active == True
        ).all()
    
    @staticmethod
    def get_by_farmer_and_product(db: Session, farmer_id: int, shop_product_id: int) -> Optional[FarmerProduct]:
        """Get specific farmer product assignment"""
        return db.query(FarmerProduct).filter(
            FarmerProduct.farmer_id == farmer_id,
            FarmerProduct.shop_product_id == shop_product_id,
            FarmerProduct.is_active == True
        ).first()
    
    @staticmethod
    def create(db: Session, obj_in: Dict[str, Any]) -> FarmerProduct:
        """Create a new farmer product assignment"""
        db_obj = FarmerProduct(**obj_in)
        db.add(db_obj)
        db.flush()
        return db_obj
    
    @staticmethod
    def update(db: Session, db_obj: FarmerProduct, obj_in: Dict[str, Any]) -> FarmerProduct:
        """Update farmer product assignment"""
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.flush()
        return db_obj
    
    @staticmethod
    def delete_by_farmer_id(db: Session, farmer_id: int) -> int:
        """Soft delete all product assignments for a farmer"""
        count = db.query(FarmerProduct).filter(
            FarmerProduct.farmer_id == farmer_id
        ).update({"is_active": False})
        db.flush()
        return count
    
    @staticmethod
    def get_by_id(db: Session, farmer_product_id: int) -> Optional[FarmerProduct]:
        """Get farmer product by ID"""
        return db.query(FarmerProduct).options(
            joinedload(FarmerProduct.shop_product).joinedload(FarmerProduct.shop_product.product)
        ).filter(
            FarmerProduct.id == farmer_product_id,
            FarmerProduct.is_active == True
        ).first()
    
    @staticmethod
    def bulk_create(db: Session, farmer_id: int, assignments: List[Dict[str, Any]]) -> List[FarmerProduct]:
        """Bulk create farmer product assignments"""
        farmer_products = []
        for assignment in assignments:
            assignment['farmer_id'] = farmer_id
            farmer_product = FarmerProduct(**assignment)
            db.add(farmer_product)
            farmer_products.append(farmer_product)
        
        db.flush()
        return farmer_products
    
    @staticmethod
    def get_farmers_by_shop_product(db: Session, shop_product_id: int) -> List[FarmerProduct]:
        """Get all farmers assigned to a specific shop product"""
        return db.query(FarmerProduct).options(
            joinedload(FarmerProduct.farmer)
        ).filter(
            FarmerProduct.shop_product_id == shop_product_id,
            FarmerProduct.is_active == True
        ).all()
    
    @staticmethod
    def get_products_with_farmer_details(db: Session, farmer_id: int) -> List[Dict[str, Any]]:
        """Get products with detailed information for a specific farmer"""
        query = db.query(FarmerProduct).options(
            joinedload(FarmerProduct.shop_product).joinedload(FarmerProduct.shop_product.product).joinedload(FarmerProduct.shop_product.product.category)
        ).filter(
            FarmerProduct.farmer_id == farmer_id,
            FarmerProduct.is_active == True
        )
        
        results = []
        for item in query.all():
            product_data = {
                'farmer_product_id': item.id,
                'farmer_id': item.farmer_id,
                'shop_product_id': item.shop_product_id,
                'preferred_price': item.preferred_price,
                'notes': item.notes,
                'is_active': item.is_active,
                'product': {
                    'id': item.shop_product.product.id,
                    'name': item.shop_product.product.name,
                    'description': item.shop_product.product.description,
                    'unit': item.shop_product.product.unit,
                    'category': {
                        'id': item.shop_product.product.category.id if item.shop_product.product.category else None,
                        'name': item.shop_product.product.category.name if item.shop_product.product.category else None
                    } if item.shop_product.product.category else None
                },
                'shop_product': {
                    'id': item.shop_product.id,
                    'price': item.shop_product.price,
                    'is_available': item.shop_product.is_available
                }
            }
            results.append(product_data)
        
        return results
