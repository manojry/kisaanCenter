
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import date

class StockItemDeclaration(BaseModel):
    product_id: int
    quantity: float
    rate: float

class FarmerStockDeclarationRequest(BaseModel):
    items: List[StockItemDeclaration]
    notes: Optional[str] = None

class FarmerPaymentRequest(BaseModel):
    shop_id: int
    amount: float
    payment_method: str  # cash, bank_transfer, upi
    notes: Optional[str] = None
    payment_type: str = "settlement"  # settlement, advance, bonus

class FarmerBalanceResponse(BaseModel):
    farmer_id: int
    total_sales: float
    total_commission: float
    total_payments: float
    current_balance: float
    last_updated: str

class StockExpiryRequest(BaseModel):
    stock_id: int
    expired_quantity: float
    notes: Optional[str] = None
