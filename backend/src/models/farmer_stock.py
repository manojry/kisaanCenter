from sqlalchemy import (
    Column, Integer, ForeignKey, DECIMAL, Date, DateTime, Text, Boolean, Enum, CheckConstraint, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
import enum
from .base import Base

class StockMode(enum.Enum):
    declared = "declared"
    implicit = "implicit"

class StockStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    archived = "archived"

class FarmerStock(Base):
    __tablename__ = "farmer_stock"
    id = Column(Integer, primary_key=True)
    farmer_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False)
    shop_id = Column(Integer, ForeignKey("shop.id"), index=True, nullable=False)
    declared_qty = Column(DECIMAL(10,3), nullable=True)
    sold_qty = Column(DECIMAL(10,3), nullable=False, default=0)
    unit_price = Column(DECIMAL(10,2), nullable=True)
    mode = Column(Enum(StockMode), nullable=False, default=StockMode.implicit)
    import enum
    from datetime import date, datetime
    from datetime import date, datetime
    import enum
    from datetime import date, datetime
    from sqlalchemy import (
        Column, Integer, ForeignKey, DECIMAL, String, Date, DateTime,
        Text, Boolean, Enum, CheckConstraint, Index, UniqueConstraint, func
    )
    from sqlalchemy.ext.hybrid import hybrid_property
    from sqlalchemy.orm import relationship, validates
    from .base import Base

    class StockMode(enum.Enum):
        declared = "declared"
        implicit = "implicit"

    class StockStatus(enum.Enum):
        active = "active"
        inactive = "inactive"
        archived = "archived"

    class FarmerStock(Base):
        __tablename__ = "farmer_stock"

        id = Column(Integer, primary_key=True)
        farmer_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
        product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
        shop_id = Column(Integer, ForeignKey("shop.id", ondelete="CASCADE"), nullable=False)

        # Stock Quantities
        declared_qty = Column(DECIMAL(10, 3), nullable=True)
        sold_qty = Column(DECIMAL(10, 3), nullable=False, default=0)

        # Pricing
        unit_price = Column(DECIMAL(10, 2), nullable=True)

        # Stock Management
        mode = Column(Enum(StockMode), nullable=False, default=StockMode.implicit)
        from datetime import date, datetime
        import enum
        from sqlalchemy import (
            Column, Integer, ForeignKey, DECIMAL, String, Date, DateTime,
            Text, Boolean, Enum, CheckConstraint, Index, UniqueConstraint, func
        )
        from sqlalchemy.ext.hybrid import hybrid_property
        from sqlalchemy.orm import relationship, validates
        from .base import Base

        class StockMode(enum.Enum):
            declared = "declared"
            implicit = "implicit"

        class StockStatus(enum.Enum):
            active = "active"
            inactive = "inactive"
            archived = "archived"

        class FarmerStock(Base):
            __tablename__ = "farmer_stock"

            id = Column(Integer, primary_key=True)
            farmer_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
            product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
            shop_id = Column(Integer, ForeignKey("shop.id", ondelete="CASCADE"), nullable=False)

            # Stock Quantities
            declared_qty = Column(DECIMAL(10, 3), nullable=True)
            sold_qty = Column(DECIMAL(10, 3), nullable=False, default=0)

            # Pricing
            unit_price = Column(DECIMAL(10, 2), nullable=True)

            # Stock Management
            mode = Column(Enum(StockMode), nullable=False, default=StockMode.implicit)
            declared_at = Column(DateTime, nullable=True)
            declared_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

            # Carryover Support
            carry_forward = Column(Boolean, default=False)
            carried_from_date = Column(Date, nullable=True)

            # Business Fields
            entry_date = Column(Date, nullable=False, default=date.today)
            notes = Column(Text, nullable=True)

            # System Fields
            created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
            updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
            status = Column(Enum(StockStatus), nullable=False, default=StockStatus.active)

            # Relationships
            farmer_user = relationship("User", foreign_keys=[farmer_user_id])
            declared_by = relationship("User", foreign_keys=[declared_by_id])
            product = relationship("Product")
            shop = relationship("Shop")
            audit_logs = relationship("FarmerStockAudit", back_populates="farmer_stock")
            transaction_items = relationship("TransactionItem", back_populates="farmer_stock")

            # Computed properties
            @hybrid_property
            def balance_qty(self):
                if self.declared_qty is not None:
                    return self.declared_qty - self.sold_qty
                return None

            @hybrid_property
            def sold_value(self):
                if self.unit_price is not None:
                    return self.sold_qty * self.unit_price
                return None

            @hybrid_property
            def is_oversold(self):
                if self.mode == StockMode.declared and self.declared_qty is not None:
                    return self.sold_qty > self.declared_qty
                return False

            @hybrid_property
            def completion_percentage(self):
                if self.declared_qty and self.declared_qty > 0:
                    return (self.sold_qty / self.declared_qty) * 100
                return 0

            # Validations
            @validates('declared_qty')
            def validate_declared_qty(self, key, declared_qty):
                if declared_qty is not None:
                    if declared_qty <= 0:
                        raise ValueError("Declared quantity must be positive")
                    if self.sold_qty and declared_qty < self.sold_qty:
                        raise ValueError("Declared quantity cannot be less than sold quantity")
                return declared_qty

            __table_args__ = (
                UniqueConstraint('farmer_user_id', 'product_id', 'shop_id', 'entry_date', name='uq_farmer_stock_daily_product'),
                CheckConstraint('declared_qty IS NULL OR declared_qty > 0', name='chk_declared_qty_positive'),
                CheckConstraint('sold_qty >= 0', name='chk_sold_qty_non_negative'),
                CheckConstraint('unit_price IS NULL OR unit_price > 0', name='chk_unit_price_positive'),
                CheckConstraint(
                    "(mode = 'declared' AND declared_qty IS NOT NULL AND declared_by_id IS NOT NULL) OR mode = 'implicit'",
                    name='chk_mode_consistency'
                ),
                CheckConstraint(
                    "(carry_forward = true AND carried_from_date IS NOT NULL) OR (carry_forward = false AND carried_from_date IS NULL)",
                    name='chk_carry_forward_consistency'
                ),
                Index('idx_farmer_stock_lookup', 'farmer_user_id', 'product_id', 'entry_date'),
                Index('idx_farmer_stock_shop_date', 'shop_id', 'entry_date'),
                Index('idx_farmer_stock_mode', 'mode', 'entry_date'),
                Index('idx_farmer_stock_shop_date_status', 'shop_id', 'entry_date', 'status'),
                Index('idx_farmer_stock_farmer_date', 'farmer_user_id', 'entry_date'),
            )
