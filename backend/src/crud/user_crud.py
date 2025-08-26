from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from ..models import User, UserRole, RecordStatus, FarmerStock, Credit, CreditStatus
from ..schemas import UserCreate, UserUpdate

class UserCRUD:
    @staticmethod
    def create(db: Session, user_data: UserCreate) -> User:
        """Create a new user"""
        user = User(**user_data.model_dump(exclude={'password'}))
        db.add(user)
        db.flush()
        return user
    
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_by_shop(db: Session, shop_id: int, active_only: bool = True) -> List[User]:
        """Get users by shop ID"""
        query = db.query(User).filter(User.shop_id == shop_id)
        if active_only:
            query = query.filter(User.status == RecordStatus.ACTIVE)
        return query.all()
    
    @staticmethod
    def get_farmers_with_stock(db: Session, shop_id: int) -> List[User]:
        """Get farmers who have active stock"""
        return db.query(User).join(FarmerStock).filter(
            and_(
                User.role == UserRole.FARMER,
                User.shop_id == shop_id,
                User.status == RecordStatus.ACTIVE,
                FarmerStock.quantity > 0,
                FarmerStock.status.in_(['active'])
            )
        ).distinct().all()
    
    @staticmethod
    def get_buyers_with_credit(db: Session, shop_id: int) -> List[User]:
        """Get buyers with outstanding credit"""
        return db.query(User).join(Credit).filter(
            and_(
                User.role == UserRole.BUYER,
                User.shop_id == shop_id,
                User.status == RecordStatus.ACTIVE,
                Credit.status.in_([CreditStatus.OUTSTANDING, CreditStatus.PARTIAL])
            )
        ).distinct().all()
    
    @staticmethod
    def update(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Update user"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            update_data = user_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(user, field, value)
            db.flush()
        return user
    
    @staticmethod
    def update_credit_limit(db: Session, user_id: int, new_limit: float, updated_by_id: int) -> Optional[User]:
        """Update user credit limit with validation"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        if user.role not in [UserRole.BUYER, UserRole.FARMER]:
            raise ValueError("Credit limit can only be set for buyers and farmers")
        
        if new_limit < 0:
            raise ValueError("Credit limit cannot be negative")
        
        user.credit_limit = new_limit
        db.flush()
        return user
    
    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        """Soft delete user"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.status = RecordStatus.INACTIVE
            db.flush()
            return True
        return False
    
    @staticmethod
    def search(db: Session, search_term: str, shop_id: Optional[int] = None) -> List[User]:
        """Search users by username or contact"""
        query = db.query(User).filter(
            or_(
                User.username.ilike(f"%{search_term}%"),
                User.contact.ilike(f"%{search_term}%")
            )
        )
        
        if shop_id:
            query = query.filter(User.shop_id == shop_id)
        
        return query.filter(User.status == RecordStatus.ACTIVE).all()