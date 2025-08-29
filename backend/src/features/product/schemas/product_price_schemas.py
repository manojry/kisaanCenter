
class ProductPriceBase(BaseModel):
    product_id: int
    price: Decimal = Field(..., gt=0)

class ProductPriceCreate(ProductPriceBase):
    created_by: int

class ProductPriceRead(ProductPriceBase):
    id: int
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "product_id": 1,
                "price": 125.50,
                "created_at": "2024-01-15T14:30:00",
                "created_by": 5
            }
        }
