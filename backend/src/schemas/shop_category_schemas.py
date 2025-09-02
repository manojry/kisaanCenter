from pydantic import BaseModel

class ShopCategoryCreate(BaseModel):
    shop_id: int
    category_id: int

class ShopCategoryRead(BaseModel):
    id: int
    shop_id: int
    category_id: int
    class Config:
        orm_mode = True
