
# Update all relevant schemas:
# - UserBase (if base fields change)
# - UserCreate (if creation fields change)
# - UserUpdate (if update fields change)
# - UserRead (if response fields change)
# - UserReadWithRelations (if relationships change)

# Base Schema
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    role: UserRole
    shop_id: Optional[int] = None
    contact: Optional[str] = Field(None, max_length=20)
    credit_limit: Optional[Decimal] = Field(default=0.00, ge=0)

# Create Schema
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    created_by: Optional[int] = None

# Update Schema
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[UserRole] = None
    shop_id: Optional[int] = None
    contact: Optional[str] = Field(None, max_length=20)
    credit_limit: Optional[Decimal] = Field(None, ge=0)
    status: Optional[RecordStatus] = None

# Read Schema
class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: RecordStatus
    
    class Config:
        from_attributes = True

# Read with Relations Schema
class UserReadWithRelations(UserRead):
    shop: Optional["ShopRead"] = None
    owned_shops: List["ShopRead"] = []
    farmer_stocks: List["FarmerStockRead"] = []
    buyer_transactions: List["TransactionRead"] = []
    credits_as_buyer: List["CreditRead"] = []
