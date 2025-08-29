
class FarmerStockBase(BaseModel):
    farmer_user_id: int
    product_id: int
    shop_id: int
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., gt=0)

class FarmerStockCreate(FarmerStockBase):
    entry_date: Optional[date] = None

class FarmerStockUpdate(BaseModel):
    quantity: Optional[Decimal] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, gt=0)
    status: Optional[RecordStatus] = None

class FarmerStockRead(FarmerStockBase):
    id: int
    total_value: Decimal
    entry_date: date
    created_at: datetime
    updated_at: datetime
    status: RecordStatus
    
    class Config:
        from_attributes = True
