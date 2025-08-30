from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from .base import Base

class FeatureControl(Base):
    __tablename__ = "feature_controls"
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, nullable=False)
    feature_name = Column(String(100), nullable=False)
    is_enabled = Column(Boolean, default=True)
    limit_value = Column(Integer, nullable=True)
    limit_type = Column(String(20), nullable=True)
    reason = Column(String(255), nullable=True)
    controlled_by = Column(Integer, nullable=True)
    effective_from = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
