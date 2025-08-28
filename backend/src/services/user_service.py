from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from ..models import User, UserRole
from ..database import get_db

class UserService:
    @staticmethod
    def get_users(db: Session, shop_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[User]:
        query = db.query(User)
        if shop_id:
            query = query.filter(User.shop_id == shop_id)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def create_user(db: Session, username: str, password_hash: str, role: UserRole, shop_id: int, contact: str = None, credit_limit: float = 0.0) -> User:
        user = User(
            username=username,
            password_hash=password_hash,
            role=role,
            shop_id=shop_id,
            contact=contact,
            credit_limit=credit_limit
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return True
        return False