from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models import Plan, PlanFeature
from ..schemas.plan_schemas import PlanCreate, PlanUpdate
from ..schemas import PaginationParams


class PlanCRUD:
    """CRUD operations for Plan model"""
    
    @staticmethod
    def create(db: Session, plan_data: PlanCreate) -> Plan:
        """Create a new plan"""
        plan_dict = plan_data.model_dump()
        plan = Plan(**plan_dict)
        db.add(plan)
        db.flush()  # Get the ID without committing
        return plan
    
    @staticmethod
    def get_by_id(db: Session, plan_id: int) -> Optional[Plan]:
        """Get plan by ID"""
        return db.query(Plan).filter(
            Plan.id == plan_id,
            Plan.status == 'active'
        ).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Plan]:
        """Get plan by name"""
        return db.query(Plan).filter(
            Plan.name == name,
            Plan.status == 'active'
        ).first()
    
    @staticmethod
    def get_multi(
        db: Session, 
        pagination: PaginationParams,
        search: Optional[str] = None,
        price_range: Optional[tuple] = None
    ) -> Dict[str, Any]:
        """Get multiple plans with optional filters"""
        query = db.query(Plan).filter(Plan.status == 'active')
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                Plan.name.ilike(search_term) | 
                Plan.description.ilike(search_term)
            )
        
        # Apply price range filter
        if price_range and len(price_range) == 2:
            min_price, max_price = price_range
            if min_price is not None:
                query = query.filter(Plan.monthly_price >= min_price)
            if max_price is not None:
                query = query.filter(Plan.monthly_price <= max_price)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        skip = (pagination.page - 1) * pagination.limit
        items = query.offset(skip).limit(pagination.limit).all()
        
        total_pages = (total + pagination.limit - 1) // pagination.limit
        
        return {
            "items": items,
            "total": total,
            "page": pagination.page,
            "limit": pagination.limit,
            "total_pages": total_pages
        }
    
    @staticmethod
    def update(db: Session, plan_id: int, plan_data: PlanUpdate) -> Optional[Plan]:
        """Update plan"""
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            return None
        
        update_data = plan_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(plan, field, value)
        
        plan.updated_at = datetime.utcnow()
        db.flush()
        return plan
    
    @staticmethod
    def delete(db: Session, plan_id: int) -> bool:
        """Soft delete plan by setting status to DELETED"""
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            return False
        
        plan.status = 'inactive'
        db.flush()
        return True
    
    @staticmethod
    def get_plan_shops(db: Session, plan_id: int) -> List[Dict]:
        """Get all shops for a plan"""
        from ..models import Shop  # Import here to avoid circular import
        
        shops = db.query(Shop).filter(
            Shop.plan_id == plan_id,
            Shop.status == 'active'
        ).all()
        
        return [shop.to_dict() for shop in shops]
    
    @staticmethod
    def get_plan_analytics(db: Session, plan_id: int) -> Dict[str, Any]:
        """Get plan analytics"""
        from ..models import Shop, Subscription  # Import here to avoid circular import
        
        # Count active shops
        shop_count = db.query(Shop).filter(
            Shop.plan_id == plan_id,
            Shop.status == 'active'
        ).count()
        
        # Count active subscriptions
        subscription_count = db.query(Subscription).filter(
            Subscription.plan_id == plan_id,
            Subscription.status == 'active'
        ).count()
        
        # Calculate monthly revenue (simplified calculation)
        plan = PlanCRUD.get_by_id(db, plan_id)
        monthly_revenue = plan.monthly_price * subscription_count if plan else 0
        
        return {
            'plan_id': plan_id,
            'plan_name': plan.name if plan else 'Unknown',
            'total_shops': shop_count,
            'total_active_subscriptions': subscription_count,
            'monthly_revenue': monthly_revenue,
            'analytics_date': datetime.now().isoformat()
        }
    
    @staticmethod
    def create_plan_feature(db: Session, plan_id: int, feature_name: str, feature_description: str = None) -> PlanFeature:
        """Create a plan feature"""
        feature = PlanFeature(
            plan_id=plan_id,
            name=feature_name,
            description=feature_description
        )
        db.add(feature)
        db.flush()
        return feature
    
    @staticmethod
    def get_plan_features(db: Session, plan_id: int) -> List[PlanFeature]:
        """Get all features for a plan"""
        return db.query(PlanFeature).filter(PlanFeature.plan_id == plan_id).all()
    
    @staticmethod
    def get_most_popular_plans(db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """Get most popular plans based on shop count"""
        from ..models import Shop  # Import here to avoid circular import
        
        plans_with_shop_count = db.query(
            Plan,
            db.func.count(Shop.id).label('shop_count')
        ).outerjoin(Shop).filter(
            Plan.status == 'active'
        ).group_by(Plan.id).order_by(
            db.func.count(Shop.id).desc()
        ).limit(limit).all()
        
        return [
            {
                'plan': plan.to_dict() if hasattr(plan, 'to_dict') else plan.__dict__,
                'shop_count': shop_count
            }
            for plan, shop_count in plans_with_shop_count
        ]