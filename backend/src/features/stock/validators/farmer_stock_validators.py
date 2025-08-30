
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session

from src.features.stock.models.farmer_stock import FarmerStock
from src.features.stock.schemas.farmer_stock_schemas import FarmerStockCreate, FarmerStockLateDeclaration
from src.core.enums import FarmerStockMode
from src.core.exceptions import ValidationError, BusinessRuleError

class FarmerStockValidator:
    
    @staticmethod
    def validate_stock_creation(db: Session, stock_data: FarmerStockCreate) -> Dict[str, Any]:
        """Validate farmer stock creation"""
        
        # Check for duplicate stock record
        existing_stock = db.query(FarmerStock).filter(
            FarmerStock.farmer_user_id == stock_data.farmer_user_id,
            FarmerStock.product_id == stock_data.product_id,
            FarmerStock.entry_date == stock_data.entry_date,
            FarmerStock.shop_id == stock_data.shop_id,
            FarmerStock.status == "active"
        ).first()
        
        if existing_stock:
            raise ValidationError(
                f"Stock record already exists for farmer {stock_data.farmer_user_id}, "
                f"product {stock_data.product_id} on {stock_data.entry_date}"
            )
        
        # Validate declared mode requirements
        if stock_data.mode == FarmerStockMode.DECLARED:
            if not stock_data.declared_qty:
                raise ValidationError("Declared quantity is required for DECLARED mode")
            if not stock_data.declared_by_id:
                raise ValidationError("declared_by_id is required for DECLARED mode")
        
        return {"valid": True}
    
    @staticmethod
    def validate_late_declaration(db: Session, stock_id: int, declaration_data: FarmerStockLateDeclaration) -> Dict[str, Any]:
        """Validate late stock declaration"""
        
        stock = db.query(FarmerStock).filter(FarmerStock.id == stock_id).first()
        if not stock:
            raise ValidationError(f"Stock record {stock_id} not found")
        
        # Check if already declared
        if stock.declared_qty is not None:
            raise BusinessRuleError(f"Stock already declared with quantity {stock.declared_qty}")
        
        # Validate declared quantity against sold quantity
        if declaration_data.declared_qty < stock.sold_qty:
            raise BusinessRuleError(
                f"Cannot declare {declaration_data.declared_qty}kg - "
                f"already sold {stock.sold_qty}kg"
            )
        
        return {
            "valid": True,
            "warning": None if declaration_data.declared_qty >= stock.sold_qty else 
                      f"Declaring exactly sold quantity - no remaining stock"
        }
    
    @staticmethod
    def validate_stock_deduction(db: Session, stock_id: int, qty_to_sell: Decimal) -> Dict[str, Any]:
        """Validate stock deduction for sale"""
        
        stock = db.query(FarmerStock).filter(FarmerStock.id == stock_id).first()
        if not stock:
            raise ValidationError(f"Stock record {stock_id} not found")
        
        new_sold_qty = stock.sold_qty + qty_to_sell
        
        # If stock is declared, check for overselling
        if stock.declared_qty is not None:
            if new_sold_qty > stock.declared_qty:
                return {
                    "valid": True,  # Allow but warn
                    "warning": f"Overselling: {new_sold_qty}kg > {stock.declared_qty}kg declared",
                    "overselling": True,
                    "excess_qty": new_sold_qty - stock.declared_qty
                }
        
        return {
            "valid": True,
            "warning": None,
            "overselling": False,
            "excess_qty": 0
        }
    
    @staticmethod
    def validate_carry_forward(db: Session, stock_id: int, carry_to_date: date) -> Dict[str, Any]:
        """Validate stock carry forward to next day"""
        
        stock = db.query(FarmerStock).filter(FarmerStock.id == stock_id).first()
        if not stock:
            raise ValidationError(f"Stock record {stock_id} not found")
        
        # Check if there's remaining stock to carry forward
        if stock.balance_qty is None:
            raise BusinessRuleError("Cannot carry forward - stock quantity not declared")
        
        if stock.balance_qty <= 0:
            raise BusinessRuleError(f"No remaining stock to carry forward (balance: {stock.balance_qty})")
        
        # Check if target date already has stock record
        existing_target = db.query(FarmerStock).filter(
            FarmerStock.farmer_user_id == stock.farmer_user_id,
            FarmerStock.product_id == stock.product_id,
            FarmerStock.entry_date == carry_to_date,
            FarmerStock.shop_id == stock.shop_id,
            FarmerStock.status == "active"
        ).first()
        
        if existing_target:
            raise BusinessRuleError(
                f"Stock record already exists for {carry_to_date} - "
                f"cannot carry forward"
            )
        
        return {
            "valid": True,
            "carry_qty": stock.balance_qty,
            "warning": None
        }