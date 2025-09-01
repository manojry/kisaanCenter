# Modular Subscription schemas
from pydantic import BaseModel
from typing import Optional

class SubscriptionBase(BaseModel):
    user_id: int
    plan_id: int
    start_date: Optional[str]
    end_date: Optional[str]
    status: Optional[str]
    amount: Optional[float]

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(SubscriptionBase):
    pass

class SubscriptionOut(SubscriptionBase):
    id: int
