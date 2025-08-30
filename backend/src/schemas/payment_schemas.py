from pydantic import BaseModel

class PaymentCreate(BaseModel):
    transaction_id: int
    amount: float
    method: str
    status: str = "pending"
    paid_by: int
    paid_to: int = None
