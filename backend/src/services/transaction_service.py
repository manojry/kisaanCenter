import logging
from decimal import Decimal
from datetime import date, datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Transaction, TransactionItem, FarmerStock, User, Shop, Payment
from ..models.enums import TransactionStatus, PaymentStatus, RecordStatus, CompletionStatus, StockStatus

logger = logging.getLogger(__name__)

# Placeholder for missing dependencies
class APIResponse:
    def __init__(self, success: bool, message: str, data=None, pagination=None):
        self.success = success
        self.message = message
        self.data = data
        self.pagination = pagination

class PaginationParams:
    def __init__(self, skip=0, limit=10):
        self.skip = skip
        self.limit = limit

class TransactionCRUD:
    @staticmethod
    def get_analytics(db, shop_id, period_start, period_end):
        return {}
    @staticmethod
    def filter(db, filters, skip, limit):
        return []
    @staticmethod
    def get_financial_summary(db, transaction_id):
        return {}

class TransactionService:
    def cancel_transaction(self, transaction_id: int, reason: str, cancelled_by: int) -> dict:
        """
        Cancel transaction and reverse all effects
        Critical for correcting mistakes in fast-paced environment
        """
        transaction = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            raise ValueError("Transaction not found")
        if transaction.status == TransactionStatus.CANCELLED:
            raise ValueError("Transaction already cancelled")
        # Reverse farmer stock changes
        transaction_items = self.db.query(TransactionItem).filter(
            TransactionItem.transaction_id == transaction_id
        ).all()
        for item in transaction_items:
            stock = self.db.query(FarmerStock).filter(
                FarmerStock.farmer_user_id == item.farmer_id,
                FarmerStock.product_id == item.product_id,
                FarmerStock.record_status == "active"
            ).first()
            if stock:
                # Reverse the sale
                stock.sold_qty -= item.quantity
                if stock.declared_qty:
                    stock.balance_qty = stock.declared_qty - stock.sold_qty
                stock.updated_at = datetime.utcnow()
        # Update transaction status
        transaction.status = TransactionStatus.CANCELLED
        transaction.completion_status = CompletionStatus.INCOMPLETE
        transaction.notes = f"Cancelled: {reason}"
        transaction.updated_at = datetime.utcnow()
        # Cancel any related payments
        payments = self.db.query(Payment).filter(Payment.transaction_id == transaction_id).all()
        for payment in payments:
            payment.status = "cancelled"
            payment.updated_at = datetime.utcnow()
        self.db.commit()
        return {
            "transaction_id": transaction_id,
            "status": "cancelled",
            "reason": reason,
            "cancelled_at": datetime.utcnow(),
            "cancelled_by": cancelled_by
        }

    def edit_transaction(self, transaction_id: int, new_items: list, edited_by: int) -> Transaction:
        """
        Edit transaction - cancel old and create new
        Maintains audit trail while allowing corrections
        """
        # Cancel original transaction
        self.cancel_transaction(transaction_id, "Edited - creating new transaction", edited_by)
        # Get original transaction details
        original = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
        # Create new transaction with updated items
        new_transaction = self.process_quick_sale(
            shop_id=original.shop_id,
            farmer_id=new_items[0]["farmer_id"],  # Assuming same farmer
            buyer_id=original.buyer_id,
            items=new_items,
            payment_mode="cash" if original.payment_status == "completed" else "credit"
        )
        # Link to original for audit trail
        new_transaction.notes = f"Edited version of transaction #{transaction_id}"
        self.db.commit()
        return new_transaction
    def __init__(self, db: Session):
        self.db = db
    
    @staticmethod
    def get_transaction_items(db: Session, transaction_id: int) -> APIResponse:
        """Get all items for a transaction."""
        items = db.query(TransactionItem).filter(TransactionItem.transaction_id == transaction_id).all()
        if not items:
            return APIResponse(success=False, message="No items found for this transaction.", data=[])
        # Convert to dicts or TransactionItemRead if available
        item_dicts = []
        for item in items:
            item_dicts.append({
                "id": item.id,
                "transaction_id": item.transaction_id,
                "product_id": item.product_id,
                "farmer_stock_id": getattr(item, "farmer_stock_id", None),
                "quantity": item.quantity,
                "price": item.price,
                "status": getattr(item, "status", "active"),
                "created_at": item.created_at,
                "updated_at": item.updated_at
            })
        return APIResponse(success=True, message="Transaction items retrieved successfully.", data=item_dicts)
    @staticmethod
    def get_analytics(db: Session, shop_id: int = None, period_start: Any = None, period_end: Any = None) -> APIResponse:
        """Get transaction analytics for a shop or all shops."""
        try:
            analytics = TransactionCRUD.get_analytics(db, shop_id, period_start, period_end)
            return APIResponse(success=True, message="Analytics retrieved successfully", data=analytics)
        except Exception as e:
            logger.error(f"Transaction analytics retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve analytics")

    @staticmethod
    def filter_transactions(db: Session, filters: Dict[str, Any], pagination: PaginationParams) -> APIResponse:
        """Filter transactions using TransactionFilter schema and pagination."""
        try:
            transactions = TransactionCRUD.filter(db, filters, pagination.skip, pagination.limit)
            transaction_data = [transaction.to_dict() for transaction in transactions]
            return APIResponse(
                success=True,
                message="Filtered transactions retrieved successfully",
                data=transaction_data,
                pagination={
                    "skip": pagination.skip,
                    "limit": pagination.limit,
                    "total": len(transaction_data)
                }
            )
        except Exception as e:
            logger.error(f"Transaction filter failed: {str(e)}")
            return APIResponse(success=False, message="Failed to filter transactions")

    @staticmethod
    def get_transaction_financial_summary(db: Session, transaction_id: int) -> APIResponse:
        """Get financial summary for a transaction."""
        try:
            summary = TransactionCRUD.get_financial_summary(db, transaction_id)
            return APIResponse(success=True, message="Financial summary retrieved successfully", data=summary)
        except Exception as e:
            logger.error(f"Transaction financial summary retrieval failed: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve financial summary")
    
    def process_quick_sale(self, shop_id: int, farmer_id: int, buyer_id: int, 
                          items: list, payment_mode: str = "cash") -> Transaction:
        """
        Single API call to process complete sale transaction
        Items format: [{"product_id": 1, "quantity": 10.5, "rate": 25.0}]
        """
        # 1. Calculate totals
        total_amount = sum(Decimal(str(item["quantity"])) * Decimal(str(item["rate"])) 
                          for item in items)
        
        # 2. Get shop commission rate
        shop = self.db.query(Shop).filter(Shop.id == shop_id).first()
        commission_rate = shop.commission_rate or Decimal("0.00")
        commission_amount = total_amount * (commission_rate / 100)
        
        # 3. Create transaction
        transaction = Transaction(
            shop_id=shop_id,
            buyer_id=buyer_id,
            type="sale",
            status=TransactionStatus.COMPLETED,
            commission_rate=commission_rate,
            commission_amount=commission_amount,
            payment_status=PaymentStatus.PENDING if payment_mode == "credit" else PaymentStatus.COMPLETED,
            buyer_paid_amount=total_amount if payment_mode == "cash" else Decimal("0.00"),
            completion_status=CompletionStatus.COMPLETE,
            date=date.today()
        )
        self.db.add(transaction)
        self.db.flush()  # Get transaction ID
        
        # 4. Process each item
        for item in items:
            # Create transaction item
            trans_item = TransactionItem(
                transaction_id=transaction.id,
                product_id=item["product_id"],
                farmer_id=farmer_id,
                quantity=Decimal(str(item["quantity"])),
                price=Decimal(str(item["rate"]))
            )
            self.db.add(trans_item)
            
            # Update/Create farmer stock (implicit mode)
            self._update_farmer_stock(farmer_id, item["product_id"], 
                                    Decimal(str(item["quantity"])), 
                                    Decimal(str(item["rate"])))
        
        self.db.commit()
        return transaction
    
    def _update_farmer_stock(self, farmer_id: int, product_id: int, 
                           sold_qty: Decimal, rate: Decimal):
        """Update farmer stock - create if doesn't exist (implicit mode)"""
        stock = self.db.query(FarmerStock).filter(
            FarmerStock.farmer_user_id == farmer_id,
            FarmerStock.product_id == product_id,
            FarmerStock.record_status == "active"
        ).first()
        
        if not stock:
            # Create implicit stock
            stock = FarmerStock(
                farmer_user_id=farmer_id,
                product_id=product_id,
                declared_qty=None,  # Implicit mode
                sold_qty=sold_qty,
                balance_qty=Decimal("0.00"),  # Will be negative for implicit
                price_per_unit=rate,
                status=StockStatus.IN_STOCK,
                mode="implicit",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.db.add(stock)
        else:
            # Update existing stock
            stock.sold_qty += sold_qty
            if stock.declared_qty is not None:
                stock.balance_qty = stock.declared_qty - stock.sold_qty
            stock.updated_at = datetime.utcnow()

router = APIRouter()

@router.post("/quick-sale")
async def process_quick_sale(sale_data: dict, db: Session = Depends(get_db)):
    """Process a quick sale transaction"""
    # TODO: Replace with actual schema and service call
    result = TransactionService(db).process_quick_sale(**sale_data)
    return result

@router.get("/")
async def get_transactions(
    shop_id: int,
    date: Optional[date] = Query(None),
    farmer_id: Optional[int] = Query(None),
    buyer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get transaction history for review"""
    filters = {"shop_id": shop_id}
    if date:
        filters["date"] = date
    if farmer_id:
        filters["farmer_id"] = farmer_id
    if buyer_id:
        filters["buyer_id"] = buyer_id
    result = TransactionService(db).get_transactions(filters)
    return result

@router.get("/{transaction_id}")
async def get_transaction_details(transaction_id: int, db: Session = Depends(get_db)):
    """Get details for a specific transaction"""
    result = TransactionService(db).get_transaction_details(transaction_id)
    return result

@router.put("/{transaction_id}/cancel")
async def cancel_transaction(transaction_id: int, reason: str = Query(...), cancelled_by: int = Query(...), db: Session = Depends(get_db)):
    """Cancel a transaction"""
    result = TransactionService(db).cancel_transaction(transaction_id, reason, cancelled_by)
    return result
