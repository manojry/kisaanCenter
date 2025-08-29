
class FarmerPaymentBase(BaseModel):
    transaction_id: int
    farmer_user_id: int
    shop_id: int
    amount: Decimal = Field(..., gt=0)
    payment_date: date
    payment_method: str = Field(..., min_length=1, max_length=50)
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

class FarmerPaymentCreate(FarmerPaymentBase):
    pass

class FarmerPaymentUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    payment_date: Optional[date] = None
    payment_method: Optional[str] = Field(None, min_length=1, max_length=50)
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    status: Optional[RecordStatus] = None

class FarmerPaymentRead(FarmerPaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: RecordStatus
    
    class Config:
        from_attributes = True
