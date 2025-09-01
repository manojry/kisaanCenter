# Modular Subscription model
from sqlalchemy import Column, Integer, String, Date, Float
from backend.src.db.base import Base

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    plan_id = Column(Integer, index=True)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String)
    amount = Column(Float)
    # Add other fields as needed
