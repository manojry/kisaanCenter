
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class ShopBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    owner_id: int
    plan_id: int
    contact: Optional[str] = Field(None, max_length=15)
    commission_rate: Optional[float] = Field(0.0, ge=0, le=100)

class ShopCreate(ShopBase):
    pass

class ShopUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    address: Optional[str] = Field(None, max_length=255)


class ShopRead(BaseModel):
    id: int
    name: str
    owner_id: int
    plan_id: int
    address: Optional[str] = Field(None, max_length=255)
    contact: Optional[str] = Field(None, max_length=15)
    commission_rate: Optional[float] = Field(0.0, ge=0, le=100)

    model_config = ConfigDict(from_attributes=True)
