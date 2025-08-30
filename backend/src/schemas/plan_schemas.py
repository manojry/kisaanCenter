from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from decimal import Decimal

class PlanBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=100)
	description: Optional[str] = None
	monthly_price: Decimal = Field(..., gt=0)
	max_farmers: int = Field(default=10, ge=1)
	max_buyers: int = Field(default=20, ge=1)
	max_transactions: int = Field(default=1000, ge=1)
	data_retention_months: int = Field(default=6, ge=1)
	features: Optional[Dict[str, Any]] = None

class PlanCreate(PlanBase):
	pass

class PlanRead(PlanBase):
	id: int
	status: str
	created_at: Optional[str]
	updated_at: Optional[str]

	model_config = ConfigDict(from_attributes=True)

class PlanUpdate(BaseModel):
	name: Optional[str] = Field(None, min_length=1, max_length=100)
	description: Optional[str] = None
	monthly_price: Optional[Decimal] = Field(None, gt=0)
	max_farmers: Optional[int] = Field(None, ge=1)
	max_buyers: Optional[int] = Field(None, ge=1)
	max_transactions: Optional[int] = Field(None, ge=1)
	data_retention_months: Optional[int] = Field(None, ge=1)
	features: Optional[Dict[str, Any]] = None
