
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Dict, Any
from datetime import date, datetime
from decimal import Decimal

from src.features.stock.models.farmer_stock import FarmerStock
from src.features.stock.models.farmer_stock_audit import FarmerStockAudit
from src.features.transactions.models.transaction import Transaction
from src.features.transactions.schemas.transaction_schemas import TransactionCreate, TransactionItemCreate
from src.core.enums import FarmerStockMode, AuditAction, RecordStatus
from src.core.exceptions import ValidationError, BusinessRuleError
from src.core.logging import get_logger

logger = get_logger(__name__)

class TransactionStockService:
    
    @staticmethod
    def create_transaction_with_stock_update(
        db: Session, 
        transaction_data: TransactionCreate,
        created_by_id: int
    ) -> Transaction:
        """
        Create transaction and update farmer stock records atomically
        
        1. Validate transaction data
        2. Check/create farmer stock records for each item
        3. Update sold quantities
        4. Create transaction record
        5. Log comprehensive audit trail
        """
        
        try:
            # Start transaction
            with db.begin():
                today = date.today()
                stock_updates = []
                
                # Process each transaction item
                for item in transaction_data.items:
                    stock_update = TransactionStockService._process_transaction_item(
                        db=db,
                        item=item,
                        shop_id=transaction_data.shop_id,
                        entry_date=today,
                        created_by_id=created_by_id
                    )
                    stock_updates.append(stock_update)
                
                # Create the transaction record
                transaction = Transaction(
                    shop_id=transaction_data.shop_id,
                    buyer_id=transaction_data.buyer_id,
                    total_amount=transaction_data.total_amount,
                    payment_status=transaction_data.payment_status,
                    created_by_id=created_by_id,
                    created_at=datetime.utcnow()
                )
                db.add(transaction)
                db.flush()  # Get transaction ID
                
                # Update audit records with transaction ID
                for stock_update in stock_updates:
                    if stock_update.get('audit_record'):
                        stock_update['audit_record'].transaction_id = transaction.id
                
                db.commit()
                logger.info(f"Transaction {transaction.id} created with {len(stock_updates)} stock updates")
                
                return transaction
                
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error in transaction creation: {str(e)}")
            raise BusinessRuleError("Failed to create transaction with stock updates")
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error in transaction creation: {str(e)}")
            raise
    
    @staticmethod
    def _process_transaction_item(
        db: Session,
        item: TransactionItemCreate,
        shop_id: int,
        entry_date: date,
        created_by_id: int
    ) -> Dict[str, Any]:
        """Process individual transaction item and update stock"""
        
        # Check if stock record exists
        stock = TransactionStockService._get_farmer_stock(
            db=db,
            farmer_id=item.farmer_id,
            product_id=item.product_id,
            shop_id=shop_id,
            entry_date=entry_date
        )
        
        if not stock:
            # Create implicit stock record
            stock = TransactionStockService._create_implicit_stock(
                db=db,
                farmer_id=item.farmer_id,
                product_id=item.product_id,
                shop_id=shop_id,
                entry_date=entry_date,
                sold_qty=item.quantity,
                unit_price=item.unit_price,
                created_by_id=created_by_id
            )
            action_type = AuditAction.SALE.value
            notes = f"Implicit stock created from first sale: {item.quantity} units"
            
        else:
            # Update existing stock
            old_sold_qty = stock.sold_qty
            stock.sold_qty += Decimal(str(item.quantity))
            stock.updated_at = datetime.utcnow()
            
            # Update unit price if provided and stock doesn't have one
            if item.unit_price and not stock.unit_price:
                stock.unit_price = Decimal(str(item.unit_price))
            
            action_type = AuditAction.SALE.value
            notes = f"Sale recorded: {item.quantity} units (total sold: {stock.sold_qty})"
            
            # Check for overselling if declared stock
            if stock.declared_qty and stock.sold_qty > stock.declared_qty:
                oversell_amount = stock.sold_qty - stock.declared_qty
                logger.warning(
                    f"Overselling detected - Stock ID: {stock.id}, "
                    f"Declared: {stock.declared_qty}, Sold: {stock.sold_qty}, "
                    f"Oversold by: {oversell_amount}"
                )
                notes += f" | WARNING: Oversold by {oversell_amount} units"
        
        # Create audit record
        audit_record = FarmerStockAudit(
            farmer_stock_id=stock.id,
            performed_by_id=created_by_id,
            action_type=action_type,
            old_values={
                "sold_qty": float(old_sold_qty) if 'old_sold_qty' in locals() else 0,
                "mode": stock.mode.value if hasattr(stock.mode, 'value') else str(stock.mode)
            },
            new_values={
                "sold_qty": float(stock.sold_qty),
                "mode": stock.mode.value if hasattr(stock.mode, 'value') else str(stock.mode)
            },
            notes=notes,
            timestamp=datetime.utcnow()
        )
        db.add(audit_record)
        
        return {
            "stock": stock,
            "audit_record": audit_record,
            "action": action_type
        }
    
    @staticmethod
    def _get_farmer_stock(
        db: Session,
        farmer_id: int,
        product_id: int,
        shop_id: int,
        entry_date: date
    ) -> FarmerStock:
        """Get existing farmer stock record"""
        
        return db.query(FarmerStock).filter(
            FarmerStock.farmer_user_id == farmer_id,
            FarmerStock.product_id == product_id,
            FarmerStock.shop_id == shop_id,
            FarmerStock.entry_date == entry_date,
            FarmerStock.status == RecordStatus.ACTIVE
        ).first()
    
    @staticmethod
    def _create_implicit_stock(
        db: Session,
        farmer_id: int,
        product_id: int,
        shop_id: int,
        entry_date: date,
        sold_qty: float,
        unit_price: float = None,
        created_by_id: int = None
    ) -> FarmerStock:
        """Create implicit stock record from first sale"""
        
        stock = FarmerStock(
            farmer_user_id=farmer_id,
            product_id=product_id,
            shop_id=shop_id,
            entry_date=entry_date,
            declared_qty=None,  # NULL for implicit mode
            sold_qty=Decimal(str(sold_qty)),
            unit_price=Decimal(str(unit_price)) if unit_price else None,
            mode=FarmerStockMode.IMPLICIT,
            declared_at=None,
            declared_by_id=None,
            carry_forward=False,
            carried_from_date=None,
            notes=f"Auto-created from first sale transaction",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            status=RecordStatus.ACTIVE
        )
        
        db.add(stock)
        db.flush()  # Get the ID
        
        logger.info(f"Created implicit stock record ID: {stock.id} for farmer {farmer_id}")
        return stock

    @staticmethod
    def declare_stock_late(
        db: Session,
        stock_id: int,
        declared_qty: float,
        declared_by_id: int,
        notes: str = None
    ) -> FarmerStock:
        """Add late declaration to existing implicit stock"""
        
        try:
            with db.begin():
                stock = db.query(FarmerStock).filter(
                    FarmerStock.id == stock_id,
                    FarmerStock.status == RecordStatus.ACTIVE
                ).first()
                
                if not stock:
                    raise ValidationError(f"Stock record {stock_id} not found")
                
                if stock.mode != FarmerStockMode.IMPLICIT:
                    raise ValidationError("Can only declare stock for implicit mode records")
                
                # Validate declared quantity
                declared_decimal = Decimal(str(declared_qty))
                if declared_decimal < stock.sold_qty:
                    raise ValidationError(
                        f"Cannot declare {declared_qty} when {stock.sold_qty} already sold"
                    )
                
                # Store old values for audit
                old_values = {
                    "mode": stock.mode.value,
                    "declared_qty": None,
                    "declared_at": None,
                    "declared_by_id": None
                }
                
                # Update stock record
                stock.declared_qty = declared_decimal
                stock.mode = FarmerStockMode.DECLARED
                stock.declared_at = datetime.utcnow()
                stock.declared_by_id = declared_by_id
                stock.updated_at = datetime.utcnow()
                if notes:
                    stock.notes = f"{stock.notes or ''} | Late declaration: {notes}".strip(" |")
                
                # Create audit record
                audit_record = FarmerStockAudit(
                    farmer_stock_id=stock.id,
                    performed_by_id=declared_by_id,
                    action_type=AuditAction.LATE_DECLARE.value,
                    old_values=old_values,
                    new_values={
                        "mode": stock.mode.value,
                        "declared_qty": float(declared_decimal),
                        "declared_at": stock.declared_at.isoformat(),
                        "declared_by_id": declared_by_id
                    },
                    notes=f"Late declaration: {declared_qty} units. {notes or ''}".strip(),
                    timestamp=datetime.utcnow()
                )
                db.add(audit_record)
                
                db.commit()
                logger.info(f"Late declaration added to stock {stock_id}: {declared_qty} units")
                
                return stock
                
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error in late declaration: {str(e)}")
            raise BusinessRuleError("Failed to add late declaration")
