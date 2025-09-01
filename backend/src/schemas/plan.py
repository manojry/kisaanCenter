from pydantic import BaseModel
from typing import Optional, Dict

class PlanBase(BaseModel):
    name: str
    description: Optional[str]
    monthly_price: float
    quarterly_price: Optional[float]
    yearly_price: Optional[float]
    max_farmers: int
    max_buyers: int
    max_transactions: int
    data_retention_months: int
    features: Optional[Dict[str, bool]]
    status: str

class PlanCreate(PlanBase):
    pass

class PlanUpdate(PlanBase):
    pass

class PlanOut(PlanBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
