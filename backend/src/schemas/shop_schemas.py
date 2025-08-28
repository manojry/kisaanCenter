from pydantic import BaseModel, Field
from typing import Optional

class ShopCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    owner_id: int
    address: Optional[str] = None
    description: Optional[str] = None
