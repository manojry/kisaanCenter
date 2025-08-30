
-- Complete the farmer stock schema with missing fields

ALTER TABLE farmer_stock 
    ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) NULL,
    ADD COLUMN IF NOT EXISTS carry_forward BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS carried_from_date DATE NULL;

-- Add comprehensive constraints
ALTER TABLE farmer_stock 
    ADD CONSTRAINT chk_valid_declaration CHECK (
        declared_qty IS NULL OR declared_qty >= sold_qty
    ),
    ADD CONSTRAINT chk_carry_forward CHECK (
        (carry_forward = true AND carried_from_date IS NOT NULL) OR 
        (carry_forward = false AND carried_from_date IS NULL)
    );

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_farmer_stock_shop_date_status ON farmer_stock(shop_id, entry_date, status);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_farmer_date ON farmer_stock(farmer_user_id, entry_date);

# Add missing relationships
transaction_items = relationship('TransactionItem', back_populates='farmer_stock')

# Add missing computed properties
@hybrid_property
def total_value(self):
    return self.sold_qty * self.unit_price

@hybrid_property
def sold_value(self):
    return self.sold_qty * self.unit_price

@hybrid_property
def is_oversold(self):
    return self.sold_qty > self.declared_qty if self.mode == FarmerStockMode.DECLARED else False

@hybrid_property
def completion_percentage(self):
    if self.declared_qty:
        return (self.sold_qty / self.declared_qty) * 100
    else:
        return 0

# Add missing constraints
__table_args__ = (
    UniqueConstraint('farmer_user_id', 'product_id', 'shop_id', 'entry_date', name='_farmer_stock_uc'),
    CheckConstraint('declared_qty IS NULL OR declared_qty >= sold_qty', name='_valid_declaration'),
    CheckConstraint('carry_forward = true AND carried_from_date IS NOT NULL OR carry_forward = false AND carried_from_date IS NULL', name='_carry_forward'),
    # redacted
)

# Add missing indexes
__table_args__ = (
    # redacted
    Index('idx_farmer_stock_shop_date_status', shop_id, entry_date, status),
    Index('idx_farmer_stock_farmer_date', farmer_user_id, entry_date),
    # redacted
)

# Add missing enums
class StockMode(enum.Enum):
    IMPLICIT = 'implicit'
    DECLARED = 'declared'

class StockStatus(enum.Enum):
    ACTIVE = 'active'
    INACTIVE = 'inactive'

# Add missing validation functions
@staticmethod
def validate_late_declaration(db: Session, late_declaration_data: FarmerStockLateDeclaration) -> Dict[str, Any]:
    """Validate late farmer stock declaration"""
    
    # Check for existing stock record
    existing_stock = db.query(FarmerStock).filter(
        FarmerStock.farmer_user_id == late_declaration_data.farmer_user_id,
        FarmerStock.product_id == late_declaration_data.product_id,
        FarmerStock.entry_date == late_declaration_data.entry_date,
        FarmerStock.shop_id == late_declaration_data.shop_id,
        FarmerStock.status == "active",
        FarmerStock.mode == FarmerStockMode.DECLARED
    ).first()
    
    if not existing_stock:
        raise ValidationError(
            f"No declared stock record found for farmer {late_declaration_data.farmer_user_id}, "
            f"product {late_declaration_data.product_id} on {late_declaration_data.entry_date}"
        )
    
    # Validate late declaration
    if late_declaration_data.declared_qty < existing_stock.sold_qty:
        raise ValidationError("Late declaration quantity cannot be less than sold quantity")
    
    return {"valid": True}

# Add missing exception classes
class ValidationError(Exception):
    pass

class BusinessRuleError(Exception):
    pass