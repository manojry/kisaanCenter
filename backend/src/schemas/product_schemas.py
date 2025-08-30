from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    description: str = None
    price: float
    category: str = None
    unit: str = "kg"
    status: str = "active"

class ProductUpdate(ProductCreate):
    pass
