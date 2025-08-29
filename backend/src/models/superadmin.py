"""
Superadmin Model - Administrative user with highest privileges
"""
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from .base import Base
from .enums import RecordStatus
from sqlalchemy import Enum as SQLEnum

class Superadmin(Base):
    """
    Superadmin model for system administrators
    Superadmins have access to all shops and system-wide operations
    """
    __tablename__ = 'superadmin'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    contact = Column(String(15), nullable=True)
    
    # Status and metadata
    status = Column(SQLEnum(RecordStatus), default=RecordStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Superadmin(id={self.id}, username='{self.username}', email='{self.email}', status='{self.status}')>"
    
    def to_dict(self):
        """Convert superadmin instance to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'contact': self.contact,
            'status': self.status.value if self.status else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
