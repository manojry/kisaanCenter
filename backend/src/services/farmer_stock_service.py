from decimal import Decimal
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database.models import FarmerStock, Product, User
from core.enums import StockStatus, RecordStatus, FarmerStockMode

class FarmerStockService:
    def __init__(self, db: Session):
        self.db = db
    
    def declare_stock(self, farmer_id: int, stock_items: list) -> list:
        """
        Morning stock declaration
        stock_items format: [{"product_id": 1, "quantity": 50.0, "rate": 25.0}]
        """
        declared_items = []
        
        for item in stock_items:
            # Check if stock already declared today
            existing_stock = self.db.query(FarmerStock).filter(
                and_(
                    FarmerStock.farmer_user_id == farmer_id,
                    FarmerStock.product_id == item["product_id"],
                    FarmerStock.record_status == RecordStatus.ACTIVE,
                    FarmerStock.created_at >= date.today()
                )
            ).first()
            
            if existing_stock:
                # Update existing declaration
                existing_stock.declared_qty += Decimal(str(item["quantity"]))
                existing_stock.balance_qty = existing_stock.declared_qty - existing_stock.sold_qty
                existing_stock.price = Decimal(str(item["rate"]))
                existing_stock.updated_at = datetime.utcnow()
                declared_items.append(existing_stock)
            else:
                # Create new stock declaration
                new_stock = FarmerStock(
                    farmer_user_id=farmer_id,
                    product_id=item["product_id"],
                    declared_qty=Decimal(str(item["quantity"])),
                    sold_qty=Decimal("0.00"),
                    balance_qty=Decimal(str(item["quantity"])),
                    price=Decimal(str(item["rate"])),
                    status=StockStatus.IN_STOCK,
                    mode=FarmerStockMode.DECLARED,
                    declared_at=datetime.utcnow(),
                    declared_by_id=farmer_id
                )
                self.db.add(new_stock)
                declared_items.append(new_stock)
        
        self.db.commit()
        return declared_items
    
    def mark_stock_expired(self, stock_id: int, expired_qty: Decimal, notes: str = None):
        """Mark stock as expired - important for perishable goods"""
        stock = self.db.query(FarmerStock).filter(FarmerStock.id == stock_id).first()
        if not stock:
            raise ValueError("Stock not found")
        
        if expired_qty > stock.balance_qty:
            raise ValueError("Expired quantity cannot exceed balance quantity")
        
        stock.expired_qty += expired_qty
        stock.balance_qty -= expired_qty
        stock.notes = f"{stock.notes or ''}\nExpired: {expired_qty} on {date.today()}"
        if notes:
            stock.notes += f" - {notes}"
        
        if stock.balance_qty <= 0:
            stock.status = StockStatus.OUT_OF_STOCK
        
        stock.updated_at = datetime.utcnow()
        self.db.commit()
        
        return stock
    
    def get_farmer_stock_summary(self, farmer_id: int, shop_id: int) -> dict:
        """Get farmer's current stock summary"""
        stocks = self.db.query(FarmerStock).join(User).filter(
            and_(
                FarmerStock.farmer_user_id == farmer_id,
                User.shop_id == shop_id,
                FarmerStock.record_status == RecordStatus.ACTIVE
            )
        ).all()
        
        summary = {
            "farmer_id": farmer_id,
            "total_products": len(stocks),
            "total_declared_value": 0,
            "total_sold_value": 0,
            "total_balance_value": 0,
            "stocks": []
        }
        
        for stock in stocks:
            stock_data = {
                "id": stock.id,
                "product_id": stock.product_id,
                "product_name": stock.product.name if stock.product else "Unknown",
                "declared_qty": float(stock.declared_qty or 0),
                "sold_qty": float(stock.sold_qty),
                "balance_qty": float(stock.balance_qty or 0),
                "expired_qty": float(stock.expired_qty),
                "rate": float(stock.price),
                "mode": stock.mode,
                "status": stock.status,
                "declared_at": stock.declared_at,
                "balance_value": float((stock.balance_qty or 0) * stock.price)
            }
            
            summary["stocks"].append(stock_data)
            summary["total_declared_value"] += float((stock.declared_qty or 0) * stock.price)
            summary["total_sold_value"] += float(stock.sold_qty * stock.price)
            summary["total_balance_value"] += stock_data["balance_value"]
        
        return summary