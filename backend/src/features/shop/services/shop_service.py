from sqlalchemy.orm import Session
from typing import Optional, List
from ..crud.shop_crud import ShopCRUD
from ....schemas import ShopCreate, ShopUpdate, ShopRead, PaginationParams, APIResponse
import logging

logger = logging.getLogger(__name__)

class ShopService:
    """Enterprise-level Shop service with business logic"""
    
    @staticmethod
    def create_shop(db: Session, shop_create: ShopCreate) -> APIResponse:
        """Create a new shop with validation"""
        try:
            validation_errors = ShopService._validate_shop_create(shop_create)
            if validation_errors:
                return APIResponse(
                    success=False,
                    message="Validation failed",
                    errors=validation_errors
                )
            
            shop = ShopCRUD.create(db, shop_create)
            db.commit()
            
            logger.info(f"Shop created successfully: {shop.name} (ID: {shop.id})")
            return APIResponse(
                success=True,
                message="Shop created successfully",
                data=ShopRead.model_validate(shop)
            )
            
        except ValueError as e:
            db.rollback()
            return APIResponse(success=False, message=str(e), errors=["Validation error"])
        except Exception as e:
            db.rollback()
            logger.error(f"Shop creation failed: {str(e)}")
            return APIResponse(success=False, message="Failed to create shop", errors=["Internal server error"])
    
    @staticmethod
    def get_shop(db: Session, shop_id: int) -> APIResponse:
        """Get shop by ID"""
        try:
            shop = ShopCRUD.get_by_id(db, shop_id)
            if not shop:
                return APIResponse(success=False, message="Shop not found")
            
            return APIResponse(
                success=True,
                message="Shop retrieved successfully",
                data=ShopRead.model_validate(shop)
            )
            
        except Exception as e:
            logger.error(f"Shop retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shop")
    
    @staticmethod
    def get_shops(db: Session, pagination: PaginationParams, filters: dict = None) -> APIResponse:
        """Get all shops with optional filtering and pagination"""
        try:
            shops = ShopCRUD.get_multi(db, pagination.skip, pagination.limit, filters)
            shop_data = [ShopRead.model_validate(shop) for shop in shops]
            
            return APIResponse(
                success=True,
                message="Shops retrieved successfully",
                data=shop_data,
                pagination={
                    "skip": pagination.skip,
                    "limit": pagination.limit,
                    "total": len(shop_data)
                }
            )
            
        except Exception as e:
            logger.error(f"Shop list retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shops")
    
    @staticmethod
    def update_shop(db: Session, shop_id: int, shop_update: ShopUpdate) -> APIResponse:
        """Update shop"""
        try:
            shop = ShopCRUD.update(db, shop_id, shop_update)
            if not shop:
                return APIResponse(success=False, message="Shop not found")
            
            db.commit()
            
            return APIResponse(
                success=True,
                message="Shop updated successfully",
                data=ShopRead.model_validate(shop)
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Shop update failed: {str(e)}")
            return APIResponse(success=False, message="Failed to update shop")
    
    @staticmethod
    def delete_shop(db: Session, shop_id: int) -> APIResponse:
        """Delete shop (soft delete)"""
        try:
            success = ShopCRUD.delete(db, shop_id)
            if not success:
                return APIResponse(success=False, message="Shop not found")
            
            db.commit()
            
            return APIResponse(
                success=True,
                message="Shop deleted successfully"
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Shop deletion failed: {str(e)}")
            return APIResponse(success=False, message="Failed to delete shop")
    
    @staticmethod
    def get_shop_users(db: Session, shop_id: int) -> APIResponse:
        """Get all users for a shop"""
        try:
            shop = ShopCRUD.get_by_id(db, shop_id)
            if not shop:
                return APIResponse(success=False, message="Shop not found")
            
            users = ShopCRUD.get_shop_users(db, shop_id)
            
            return APIResponse(
                success=True,
                message="Shop users retrieved successfully",
                data=users
            )
            
        except Exception as e:
            logger.error(f"Shop users retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shop users")
    
    @staticmethod
    def get_shop_products(db: Session, shop_id: int) -> APIResponse:
        """Get all products for a shop"""
        try:
            shop = ShopCRUD.get_by_id(db, shop_id)
            if not shop:
                return APIResponse(success=False, message="Shop not found")
            
            products = ShopCRUD.get_shop_products(db, shop_id)
            
            return APIResponse(
                success=True,
                message="Shop products retrieved successfully",
                data=products
            )
            
        except Exception as e:
            logger.error(f"Shop products retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shop products")
    
    @staticmethod
    def get_shop_analytics(db: Session, shop_id: int) -> APIResponse:
        """Get shop analytics"""
        try:
            shop = ShopCRUD.get_by_id(db, shop_id)
            if not shop:
                return APIResponse(success=False, message="Shop not found")
            
            analytics = ShopCRUD.get_shop_analytics(db, shop_id)
            
            return APIResponse(
                success=True,
                message="Shop analytics retrieved successfully",
                data=analytics
            )
            
        except Exception as e:
            logger.error(f"Shop analytics retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shop analytics")
    
    @staticmethod
    def _validate_shop_create(shop_create: ShopCreate) -> List[str]:
        """Validate shop creation data"""
        errors = []
        
        if not shop_create.name or len(shop_create.name.strip()) < 2:
            errors.append("Shop name must be at least 2 characters long")
        
        if shop_create.location and len(shop_create.location.strip()) > 255:
            errors.append("Location cannot exceed 255 characters")
        
        return errors