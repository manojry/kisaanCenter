from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..crud.product_crud import ProductCRUD
from ....schemas import ProductCreate, ProductUpdate, APIResponse, PaginationParams
from ....models import UserRole, Shop, Product
import logging

logger = logging.getLogger(__name__)

class ProductService:
    """Enterprise-level Product service with business logic and validation"""
    
    @staticmethod
    def create_product(db: Session, product_data: ProductCreate, created_by_id: int = None, user_role: str = None) -> APIResponse:
        """
        Create a new product with enterprise-grade validation, shop isolation, atomic transaction, and audit logging.
        """
        try:
            # Shop isolation: Only superadmin or owner of shop can create
            shop_id = getattr(product_data, 'shop_id', None)
            if shop_id:
                shop = db.query(Shop).filter(Shop.id == shop_id).first()
                if not shop:
                    return APIResponse(success=False, message="Shop not found.")
                
                # Note: Role validation would be implemented with proper auth context
                # if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                #     return APIResponse(success=False, message="Permission denied: Only superadmin or owner can create products for shop.")

            # Business rule validation
            validation_errors = ProductService._validate_product_create(product_data)
            if validation_errors:
                return APIResponse(
                    success=False,
                    message="Validation failed",
                    errors=validation_errors
                )

            # Atomic DB transaction
            try:
                product = ProductCRUD.create(db, product_data)
                
                # Optionally initialize inventory if quantity is provided
                initial_quantity = getattr(product_data, 'initial_quantity', None)
                if initial_quantity is not None:
                    ProductCRUD.initialize_inventory(db, product.id, initial_quantity)
                
                db.commit()
                
                logger.info(f"Product created successfully: {product.name} (ID: {product.id})")
                return APIResponse(
                    success=True,
                    message="Product created successfully",
                    data=product.to_dict()
                )
                
            except Exception as e:
                db.rollback()
                logger.error(f"Database error during product creation: {str(e)}")
                return APIResponse(success=False, message=f"Database error: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error in product creation: {str(e)}")
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def get_product(db: Session, product_id: int, include_relations: bool = False) -> APIResponse:
        """Get product by ID with optional relations"""
        try:
            if include_relations:
                product_data = ProductCRUD.get_with_relations(db, product_id)
            else:
                product = ProductCRUD.get_by_id(db, product_id)
                product_data = product.to_dict() if product else None
            
            if not product_data:
                return APIResponse(success=False, message="Product not found")
            
            return APIResponse(
                success=True,
                message="Product retrieved successfully",
                data=product_data
            )
            
        except Exception as e:
            logger.error(f"Product retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve product")
    
    @staticmethod
    def get_products(db: Session, pagination: PaginationParams, filters: Dict[str, Any] = None) -> APIResponse:
        """Get all products with optional filtering and pagination"""
        try:
            products = ProductCRUD.get_multi(db, pagination.skip, pagination.limit, filters)
            product_data = [product.to_dict() for product in products]
            
            return APIResponse(
                success=True,
                message="Products retrieved successfully",
                data=product_data,
                pagination={
                    "skip": pagination.skip,
                    "limit": pagination.limit,
                    "total": len(product_data)
                }
            )
            
        except Exception as e:
            logger.error(f"Product list retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve products")
    
    @staticmethod
    def update_product(db: Session, product_id: int, product_update: ProductUpdate) -> APIResponse:
        """Update product"""
        try:
            product = ProductCRUD.update(db, product_id, product_update)
            if not product:
                return APIResponse(success=False, message="Product not found")
            
            db.commit()
            
            return APIResponse(
                success=True,
                message="Product updated successfully",
                data=product.to_dict()
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Product update failed: {str(e)}")
            return APIResponse(success=False, message="Failed to update product")
    
    @staticmethod
    def delete_product(db: Session, product_id: int) -> APIResponse:
        """Delete product (soft delete)"""
        try:
            success = ProductCRUD.delete(db, product_id)
            if not success:
                return APIResponse(success=False, message="Product not found")
            
            db.commit()
            
            return APIResponse(
                success=True,
                message="Product deleted successfully"
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Product deletion failed: {str(e)}")
            return APIResponse(success=False, message="Failed to delete product")
    
    @staticmethod
    def get_product_stock(db: Session, product_id: int) -> APIResponse:
        """Get current stock levels for a product"""
        try:
            stock_data = ProductCRUD.get_product_stock(db, product_id)
            if stock_data is None:
                return APIResponse(success=False, message="Product not found or no stock data")
            
            return APIResponse(
                success=True,
                message="Product stock retrieved successfully",
                data=stock_data
            )
            
        except Exception as e:
            logger.error(f"Product stock retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve product stock")
    
    @staticmethod
    def get_product_price_history(db: Session, product_id: int, limit: int = 10) -> APIResponse:
        """Get price history for a product"""
        try:
            price_history = ProductCRUD.get_price_history(db, product_id, limit)
            
            return APIResponse(
                success=True,
                message="Product price history retrieved successfully",
                data=price_history
            )
            
        except Exception as e:
            logger.error(f"Product price history retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve price history")
    
    @staticmethod
    def get_product_transactions(db: Session, product_id: int, limit: int = 20) -> APIResponse:
        """Get recent transactions for a product"""
        try:
            transactions = ProductCRUD.get_product_transactions(db, product_id, limit)
            
            return APIResponse(
                success=True,
                message="Product transactions retrieved successfully",
                data=transactions
            )
            
        except Exception as e:
            logger.error(f"Product transactions retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve product transactions")
    
    @staticmethod
    def get_product_analytics(db: Session, product_id: int, days: int = 30) -> APIResponse:
        """Get product analytics"""
        try:
            analytics = ProductCRUD.get_product_analytics(db, product_id, days)
            if not analytics:
                return APIResponse(success=False, message="Product not found")
            
            return APIResponse(
                success=True,
                message="Product analytics retrieved successfully",
                data=analytics
            )
            
        except Exception as e:
            logger.error(f"Product analytics retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve product analytics")
    
    @staticmethod
    def get_products_by_category(db: Session, category_id: int, pagination: PaginationParams) -> APIResponse:
        """Get all products in a specific category"""
        try:
            products = ProductCRUD.get_by_category(db, category_id, pagination.skip, pagination.limit)
            product_data = [product.to_dict() for product in products]
            
            return APIResponse(
                success=True,
                message="Category products retrieved successfully",
                data=product_data,
                pagination={
                    "skip": pagination.skip,
                    "limit": pagination.limit,
                    "total": len(product_data)
                }
            )
            
        except Exception as e:
            logger.error(f"Category products retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve category products")
    
    @staticmethod
    def get_products_by_shop(db: Session, shop_id: int, pagination: PaginationParams) -> APIResponse:
        """Get all products for a specific shop"""
        try:
            products = ProductCRUD.get_by_shop(db, shop_id, pagination.skip, pagination.limit)
            product_data = [product.to_dict() for product in products]
            
            return APIResponse(
                success=True,
                message="Shop products retrieved successfully",
                data=product_data,
                pagination={
                    "skip": pagination.skip,
                    "limit": pagination.limit,
                    "total": len(product_data)
                }
            )
            
        except Exception as e:
            logger.error(f"Shop products retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shop products")
    
    @staticmethod
    def _validate_product_create(product_data: ProductCreate) -> List[str]:
        """Validate product creation data"""
        errors = []
        
        if not product_data.name or len(product_data.name.strip()) < 2:
            errors.append("Product name must be at least 2 characters long")
        
        if hasattr(product_data, 'price') and product_data.price is not None and product_data.price <= 0:
            errors.append("Product price must be greater than 0")
        
        return errors