from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

class QuickSaleItem(BaseModel):
    product_id: int
    quantity: Decimal
    price: Decimal  # Price per unit

class QuickSaleRequest(BaseModel):
    farmer_id: int
    buyer_id: Optional[int] = None
    items: List[QuickSaleItem]
    commission_rate: Decimal  # Commission rate for this transaction
    payment_type: str  # e.g., 'cash', 'digital'
