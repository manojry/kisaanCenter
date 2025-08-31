from pydantic import BaseModel, ConfigDict, Field, validator
from typing import Optional, List, Union, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum

# ===============================
# ENUMS for API Schemas
# ===============================

class UserRoleEnum(str, Enum):
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    FARMER = "farmer"
    BUYER = "buyer"
    EMPLOYEE = "employee"

class TransactionTypeEnum(str, Enum):
    SALE = "sale"
    RETURN = "return"
    ADJUSTMENT = "adjustment"

class CompletionStatusEnum(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETE = "complete"

class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"

class RecordStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

# ===============================
# BASE SCHEMAS
# ===============================

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: Optional[datetime] = None

# ===============================
# USER SCHEMAS
# ===============================

class UserBase(BaseSchema):
    username: str = Field(..., min_length=3, max_length=50)
    role: str
    contact: Optional[str] = Field(None, max_length=20)
    shop_id: Optional[int] = None
    credit_limit: Optional[Decimal] = Field(None, ge=0)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    created_by: Optional[int] = None
    status: str = "active"

class UserUpdate(BaseSchema):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    contact: Optional[str] = Field(None, max_length=20)
    credit_limit: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = None

class UserRead(UserBase, TimestampMixin):
    id: int
    status: str
    created_by: Optional[int] = None
    
class UserReadWithRelations(UserRead):
    shop: Optional["ShopRead"] = None
    transactions: List["TransactionRead"] = []
    credits: List["CreditRead"] = []

# ===============================
# SHOP SCHEMAS
# ===============================

class ShopBase(BaseSchema):
    name: str = Field(..., min_length=2, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    plan_id: Optional[int] = None

class ShopCreate(ShopBase):
    created_by: Optional[int] = None
    status: RecordStatusEnum = RecordStatusEnum.ACTIVE

class ShopUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    plan_id: Optional[int] = None
    status: Optional[RecordStatusEnum] = None

class ShopRead(ShopBase, TimestampMixin):
    id: int
    status: RecordStatusEnum
    created_by: Optional[int] = None

class ShopReadWithRelations(ShopRead):
    users: List[UserRead] = []
    products: List["ProductRead"] = []
    transactions: List["TransactionRead"] = []

# ===============================
# PRODUCT SCHEMAS
# ===============================

class ProductBase(BaseSchema):
    name: str = Field(..., min_length=2, max_length=100)
    category_id: Optional[int] = None
    shop_id: int

class ProductCreate(ProductBase):
    status: RecordStatusEnum = RecordStatusEnum.ACTIVE

class ProductUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    category_id: Optional[int] = None
    status: Optional[RecordStatusEnum] = None

class ProductRead(ProductBase, TimestampMixin):
    id: int
    status: RecordStatusEnum

class ProductReadWithRelations(ProductRead):
    category: Optional["CategoryRead"] = None
    stock_items: List["FarmerStockRead"] = []
    commission_rules: List["CommissionRuleRead"] = []

# ===============================
# TRANSACTION SCHEMAS
# ===============================

class TransactionBase(BaseSchema):
    shop_id: int
    buyer_user_id: int
    transaction_type: TransactionTypeEnum = TransactionTypeEnum.SALE
    commission_rate: Decimal = Field(..., ge=0, le=100, decimal_places=2)
    parent_transaction_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    transaction_items: List["TransactionItemCreate"] = []
    
class TransactionUpdate(BaseSchema):
    commission_rate: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    commission_confirmed: Optional[bool] = None
    status: Optional[str] = None

class TransactionRead(TransactionBase, TimestampMixin):
    id: int
    status: str
    commission_amount: Optional[Decimal] = None
    payment_status: PaymentStatusEnum
    buyer_paid_amount: Optional[Decimal] = None
    farmer_paid_amount: Optional[Decimal] = None
    commission_confirmed: bool = False
    completion_status: CompletionStatusEnum
    date: datetime

class TransactionReadWithRelations(TransactionRead):
    buyer: Optional[UserRead] = None
    items: List["TransactionItemRead"] = []
    payments: List["PaymentRead"] = []
    credits: List["CreditRead"] = []
    farmer_payments: List["FarmerPaymentRead"] = []

# ===============================
# TRANSACTION ITEM SCHEMAS
# ===============================

class TransactionItemBase(BaseSchema):
    product_id: int
    farmer_stock_id: Optional[int] = None
    quantity: Decimal = Field(..., gt=0, decimal_places=3)
    price: Decimal = Field(..., gt=0, decimal_places=2)

class TransactionItemCreate(TransactionItemBase):
    status: RecordStatusEnum = RecordStatusEnum.ACTIVE
    farmer_user_id: Optional[int] = None  # Needed for on-the-fly stock creation

class TransactionItemUpdate(BaseSchema):
    quantity: Optional[Decimal] = Field(None, gt=0, decimal_places=3)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    status: Optional[RecordStatusEnum] = None

class TransactionItemRead(TransactionItemBase, TimestampMixin):
    id: int
    transaction_id: int
    status: RecordStatusEnum

class TransactionItemReadWithRelations(TransactionItemRead):
    product: Optional[ProductRead] = None
    farmer_stock: Optional["FarmerStockRead"] = None

# ===============================
# PAYMENT SCHEMAS
# ===============================

class PaymentBase(BaseSchema):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    payment_method_id: int
    payment_type: str = "payment"
    date: datetime = Field(default_factory=datetime.utcnow)

class PaymentCreate(PaymentBase):
    transaction_id: Optional[int] = None
    credit_id: Optional[int] = None
    status: str = "pending"

class PaymentUpdate(BaseSchema):
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    payment_method_id: Optional[int] = None
    status: Optional[str] = None

class PaymentRead(PaymentBase, TimestampMixin):
    id: int
    transaction_id: Optional[int] = None
    credit_id: Optional[int] = None
    status: str

class PaymentReadWithRelations(PaymentRead):
    transaction: Optional[TransactionRead] = None
    credit: Optional["CreditRead"] = None
    payment_method: Optional["PaymentMethodRead"] = None

# ===============================
# CREDIT SCHEMAS
# ===============================

class CreditBase(BaseSchema):
    transaction_id: int
    buyer_user_id: int
    amount: Decimal = Field(..., gt=0, decimal_places=2)

class CreditCreate(CreditBase):
    status: str = "outstanding"
    details: List["CreditDetailCreate"] = []

class CreditUpdate(BaseSchema):
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    status: Optional[str] = None

class CreditRead(CreditBase, TimestampMixin):
    id: int
    status: str

class CreditReadWithRelations(CreditRead):
    buyer: Optional[UserRead] = None
    transaction: Optional[TransactionRead] = None
    details: List["CreditDetailRead"] = []
    payments: List[PaymentRead] = []

# ===============================
# FARMER STOCK SCHEMAS
# ===============================

class FarmerStockBase(BaseSchema):
    shop_id: int
    farmer_user_id: int
    product_id: int
    quantity: Decimal = Field(..., gt=0, decimal_places=3)
    date: datetime = Field(default_factory=datetime.utcnow)

class FarmerStockCreate(FarmerStockBase):
    status: str = "active"

class FarmerStockUpdate(BaseSchema):
    quantity: Optional[Decimal] = Field(None, gt=0, decimal_places=3)
    status: Optional[str] = None

class FarmerStockRead(FarmerStockBase, TimestampMixin):
    id: int
    status: str

class FarmerStockReadWithRelations(FarmerStockRead):
    farmer: Optional[UserRead] = None
    product: Optional[ProductRead] = None
    shop: Optional[ShopRead] = None

# ===============================
# SUPPORT SCHEMAS
# ===============================

class CategoryRead(BaseSchema, TimestampMixin):
    id: int
    name: str
    status: RecordStatusEnum

class CommissionRuleRead(BaseSchema, TimestampMixin):
    id: int
    shop_id: int
    product_id: Optional[int] = None
    rule_type: str
    rate: Decimal

class CreditDetailCreate(BaseSchema):
    farmer_user_id: int
    product_id: int
    quantity: Decimal = Field(..., gt=0, decimal_places=3)
    price: Decimal = Field(..., gt=0, decimal_places=2)

class CreditDetailRead(CreditDetailCreate, TimestampMixin):
    id: int
    credit_id: int

class FarmerPaymentRead(BaseSchema, TimestampMixin):
    id: int
    transaction_id: int
    farmer_stock_id: int
    farmer_user_id: int
    amount: Decimal
    payment_type: str
    payment_method_id: int
    remarks: Optional[str] = None
    date: datetime

class PaymentMethodRead(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    status: RecordStatusEnum

# ===============================
# RESPONSE SCHEMAS
# ===============================

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    total_pages: int

class APIResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: Optional[List[str]] = None
    error_code: Optional[str] = None

# ===============================
# BUSINESS LOGIC SCHEMAS
# ===============================

class TransactionSummary(BaseSchema):
    transaction_id: int
    total_amount: Decimal
    commission_amount: Decimal
    net_farmer_amount: Decimal
    buyer_paid_amount: Decimal
    farmer_paid_amount: Decimal
    outstanding_amount: Decimal
    completion_percentage: float

class DashboardStats(BaseSchema):
    total_transactions: int
    pending_transactions: int
    completed_transactions: int
    total_sales: Decimal
    total_commission: Decimal
    outstanding_credits: Decimal
    active_farmers: int
    active_buyers: int

# ===============================
# INVENTORY SCHEMAS
# ===============================

class InventoryCreate(BaseModel):
    product_id: int
    shop_id: int
    quantity: int = 0
    status: Optional[str] = "active"

class InventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    status: Optional[str] = None

class InventoryRead(BaseModel):
    id: int
    product_id: int
    shop_id: int
    quantity: int
    status: str
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

# ===============================
# ORDER SCHEMAS
# ===============================

class OrderCreate(BaseModel):
    product_id: int
    shop_id: int
    buyer_id: int
    quantity: int
    total_price: float
    status: Optional[str] = "pending"

class OrderUpdate(BaseModel):
    quantity: Optional[int] = None
    status: Optional[str] = None

class OrderRead(BaseModel):
    id: int
    product_id: int
    shop_id: int
    buyer_id: int
    quantity: int
    total_price: float
    status: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

# Update forward references
UserReadWithRelations.model_rebuild()
ShopReadWithRelations.model_rebuild()
ProductReadWithRelations.model_rebuild()
TransactionReadWithRelations.model_rebuild()
TransactionItemReadWithRelations.model_rebuild()
PaymentReadWithRelations.model_rebuild()
CreditReadWithRelations.model_rebuild()
FarmerStockReadWithRelations.model_rebuild()
