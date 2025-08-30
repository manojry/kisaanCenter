from pydantic import BaseModel, ConfigDict
from typing import Optional

class OrderCreate(BaseModel):
    product_id: int
    quantity: int
    buyer_id: int
    shop_id: int
    price: Optional[float] = None

class OrderUpdate(BaseModel):
    quantity: Optional[int] = None
    price: Optional[float] = None

class OrderRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    buyer_id: int
    shop_id: int
    price: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
