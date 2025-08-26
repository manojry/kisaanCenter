from sqlalchemy.orm import Session
from typing import Optional, List
from ..crud.shop_crud import ShopCRUD
from ..schemas import ShopCreate, ShopUpdate, ShopRead, PaginationParams, APIResponse
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
            logger.error(f"Failed to get shop {shop_id}: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shop")
    
    @staticmethod
    def get_shops(
        db: Session, 
        pagination: PaginationParams, 
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> APIResponse:
        """Get paginated shops with filtering"""
        try:
            result = ShopCRUD.get_multi(db, pagination, search, status_filter)
            shops_data = [ShopRead.model_validate(shop) for shop in result["items"]]
            
            return APIResponse(
                success=True,
                message="Shops retrieved successfully",
                data={
                    "items": shops_data,
                    "total": result["total"],
                    "page": result["page"],
                    "limit": result["limit"],
                    "total_pages": result["total_pages"]
                }
            )
        except Exception as e:
            logger.error(f"Failed to get shops: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shops")
    
    @staticmethod
    def update_shop(db: Session, shop_id: int, shop_update: ShopUpdate) -> APIResponse:
        """Update shop with validation"""
        try:
            existing_shop = ShopCRUD.get_by_id(db, shop_id)
            if not existing_shop:
                return APIResponse(success=False, message="Shop not found")
            
            updated_shop = ShopCRUD.update(db, shop_id, shop_update)
            db.commit()
            
            return APIResponse(
                success=True,
                message="Shop updated successfully",
                data=ShopRead.model_validate(updated_shop)
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Shop update failed: {str(e)}")
            return APIResponse(success=False, message="Failed to update shop")
    
    @staticmethod
    def delete_shop(db: Session, shop_id: int) -> APIResponse:
        """Soft delete shop"""
        try:
            shop = ShopCRUD.get_by_id(db, shop_id)
            if not shop:
                return APIResponse(success=False, message="Shop not found")
            
            success = ShopCRUD.delete(db, shop_id)
            if success:
                db.commit()
                return APIResponse(success=True, message="Shop deleted successfully")
            else:
                return APIResponse(success=False, message="Failed to delete shop")
        except Exception as e:
            db.rollback()
            logger.error(f"Shop deletion failed: {str(e)}")
            return APIResponse(success=False, message="Failed to delete shop")
    
    @staticmethod
    def _validate_shop_create(shop_create: ShopCreate) -> List[str]:
        """Validate shop creation data"""
        errors = []
        
        if len(shop_create.name) < 2:
            errors.append("Shop name must be at least 2 characters")
        if len(shop_create.name) > 100:
            errors.append("Shop name cannot exceed 100 characters")
        
        return errors
