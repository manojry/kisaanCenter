from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
from decimal import Decimal
from ..crud.plan_crud import PlanCRUD
from ..schemas.plan_schemas import PlanCreate, PlanUpdate, PlanRead, PlanAnalytics
from ..schemas import PaginationParams, APIResponse
import logging

logger = logging.getLogger(__name__)


class PlanService:
    """Enterprise-level Plan service with business logic"""
    
    @staticmethod
    def create_plan(db: Session, plan_create: PlanCreate) -> APIResponse:
        """Create a new plan with validation"""
        try:
            # Validate plan creation data
            validation_errors = PlanService._validate_plan_create(db, plan_create)
            if validation_errors:
                return APIResponse(
                    success=False,
                    message="Validation failed",
                    errors=validation_errors
                )
            
            # Calculate discount prices if not provided
            if not plan_create.quarterly_price:
                plan_create.quarterly_price = plan_create.monthly_price * 3 * Decimal('0.95')  # 5% discount
            
            if not plan_create.yearly_price:
                plan_create.yearly_price = plan_create.monthly_price * 12 * Decimal('0.85')  # 15% discount
            
            plan = PlanCRUD.create(db, plan_create)
            db.commit()
            
            logger.info(f"Plan created successfully: {plan.name} (ID: {plan.id})")
            return APIResponse(
                success=True,
                message="Plan created successfully",
                data=PlanRead.model_validate(plan)
            )
            
        except ValueError as e:
            db.rollback()
            return APIResponse(success=False, message=str(e), errors=["Validation error"])
        except Exception as e:
            db.rollback()
            logger.error(f"Plan creation failed: {str(e)}")
            return APIResponse(success=False, message="Failed to create plan", errors=["Internal server error"])
    
    @staticmethod
    def get_plan(db: Session, plan_id: int) -> APIResponse:
        """Get plan by ID"""
        try:
            plan = PlanCRUD.get_by_id(db, plan_id)
            if not plan:
                return APIResponse(success=False, message="Plan not found")
            
            return APIResponse(
                success=True,
                message="Plan retrieved successfully",
                data=PlanRead.model_validate(plan)
            )
        except Exception as e:
            logger.error(f"Failed to get plan {plan_id}: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve plan")
    
    @staticmethod
    def get_plans(
        db: Session, 
        pagination: PaginationParams, 
        search: Optional[str] = None,
        price_min: Optional[Decimal] = None,
        price_max: Optional[Decimal] = None
    ) -> APIResponse:
        """Get paginated plans with filtering"""
        try:
            price_range = None
            if price_min is not None or price_max is not None:
                price_range = (price_min, price_max)
            
            result = PlanCRUD.get_multi(db, pagination, search, price_range)
            plans_data = [PlanRead.model_validate(plan) for plan in result["items"]]
            
            return APIResponse(
                success=True,
                message="Plans retrieved successfully",
                data={
                    "items": plans_data,
                    "total": result["total"],
                    "page": result["page"],
                    "limit": result["limit"],
                    "total_pages": result["total_pages"]
                }
            )
        except Exception as e:
            logger.error(f"Failed to get plans: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve plans")
    
    @staticmethod
    def update_plan(db: Session, plan_id: int, plan_update: PlanUpdate) -> APIResponse:
        """Update plan with validation"""
        try:
            existing_plan = PlanCRUD.get_by_id(db, plan_id)
            if not existing_plan:
                return APIResponse(success=False, message="Plan not found")
            
            # Validate update data
            validation_errors = PlanService._validate_plan_update(db, plan_id, plan_update)
            if validation_errors:
                return APIResponse(
                    success=False,
                    message="Validation failed",
                    errors=validation_errors
                )
            
            updated_plan = PlanCRUD.update(db, plan_id, plan_update)
            db.commit()
            
            return APIResponse(
                success=True,
                message="Plan updated successfully",
                data=PlanRead.model_validate(updated_plan)
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Plan update failed: {str(e)}")
            return APIResponse(success=False, message="Failed to update plan")
    
    @staticmethod
    def delete_plan(db: Session, plan_id: int) -> APIResponse:
        """Soft delete plan with checks"""
        try:
            plan = PlanCRUD.get_by_id(db, plan_id)
            if not plan:
                return APIResponse(success=False, message="Plan not found")
            
            # Check if plan has active shops
            shops = PlanCRUD.get_plan_shops(db, plan_id)
            if shops:
                return APIResponse(
                    success=False, 
                    message="Cannot delete plan with active shops. Please reassign shops first.",
                    errors=["Plan has active shops"]
                )
            
            success = PlanCRUD.delete(db, plan_id)
            if success:
                db.commit()
                return APIResponse(success=True, message="Plan deleted successfully")
            else:
                return APIResponse(success=False, message="Failed to delete plan")
        except Exception as e:
            db.rollback()
            logger.error(f"Plan deletion failed: {str(e)}")
            return APIResponse(success=False, message="Failed to delete plan")
    
    @staticmethod
    def get_plan_analytics(db: Session, plan_id: int) -> APIResponse:
        """Get plan analytics"""
        try:
            analytics_data = PlanCRUD.get_plan_analytics(db, plan_id)
            analytics = PlanAnalytics(**analytics_data)
            
            return APIResponse(
                success=True,
                message="Plan analytics retrieved successfully",
                data=analytics
            )
        except Exception as e:
            logger.error(f"Failed to get plan analytics: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve plan analytics")
    
    @staticmethod
    def get_popular_plans(db: Session, limit: int = 5) -> APIResponse:
        """Get most popular plans"""
        try:
            popular_plans = PlanCRUD.get_most_popular_plans(db, limit)
            
            return APIResponse(
                success=True,
                message="Popular plans retrieved successfully",
                data={"popular_plans": popular_plans}
            )
        except Exception as e:
            logger.error(f"Failed to get popular plans: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve popular plans")
    
    @staticmethod
    def _validate_plan_create(db: Session, plan_create: PlanCreate) -> List[str]:
        """Validate plan creation data"""
        errors = []
        
        # Check name length
        if len(plan_create.name) < 2:
            errors.append("Plan name must be at least 2 characters")
        if len(plan_create.name) > 100:
            errors.append("Plan name cannot exceed 100 characters")
        
        # Check for duplicate name
        existing_plan = PlanCRUD.get_by_name(db, plan_create.name)
        if existing_plan:
            errors.append("Plan name already exists")
        
        # Validate pricing
        if plan_create.monthly_price <= 0:
            errors.append("Monthly price must be greater than 0")
        
        if plan_create.quarterly_price and plan_create.quarterly_price <= 0:
            errors.append("Quarterly price must be greater than 0")
        
        if plan_create.yearly_price and plan_create.yearly_price <= 0:
            errors.append("Yearly price must be greater than 0")
        
        # Validate limits
        if plan_create.max_farmers < 1:
            errors.append("Maximum farmers must be at least 1")
        
        if plan_create.max_buyers < 1:
            errors.append("Maximum buyers must be at least 1")
        
        if plan_create.max_transactions < 1:
            errors.append("Maximum transactions must be at least 1")
        
        if plan_create.data_retention_months < 1:
            errors.append("Data retention must be at least 1 month")
        
        return errors
    
    @staticmethod
    def _validate_plan_update(db: Session, plan_id: int, plan_update: PlanUpdate) -> List[str]:
        """Validate plan update data"""
        errors = []
        
        # Check name length if provided
        if plan_update.name is not None:
            if len(plan_update.name) < 2:
                errors.append("Plan name must be at least 2 characters")
            if len(plan_update.name) > 100:
                errors.append("Plan name cannot exceed 100 characters")
            
            # Check for duplicate name (excluding current plan)
            existing_plan = PlanCRUD.get_by_name(db, plan_update.name)
            if existing_plan and existing_plan.id != plan_id:
                errors.append("Plan name already exists")
        
        # Validate pricing if provided
        if plan_update.monthly_price is not None and plan_update.monthly_price <= 0:
            errors.append("Monthly price must be greater than 0")
        
        if plan_update.quarterly_price is not None and plan_update.quarterly_price <= 0:
            errors.append("Quarterly price must be greater than 0")
        
        if plan_update.yearly_price is not None and plan_update.yearly_price <= 0:
            errors.append("Yearly price must be greater than 0")
        
        # Validate limits if provided
        if plan_update.max_farmers is not None and plan_update.max_farmers < 1:
            errors.append("Maximum farmers must be at least 1")
        
        if plan_update.max_buyers is not None and plan_update.max_buyers < 1:
            errors.append("Maximum buyers must be at least 1")
        
        if plan_update.max_transactions is not None and plan_update.max_transactions < 1:
            errors.append("Maximum transactions must be at least 1")
        
        if plan_update.data_retention_months is not None and plan_update.data_retention_months < 1:
            errors.append("Data retention must be at least 1 month")
        
        return errors