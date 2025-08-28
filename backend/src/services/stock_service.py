from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date
from ..models import FarmerStock, StockStatus, Product, User

class StockService:
    @staticmethod
    def get_stock(db: Session, shop_id: int, skip: int = 0, limit: int = 100) -> List[dict]:
        stocks = db.query(FarmerStock).join(Product).join(User).filter(
            FarmerStock.shop_id == shop_id,
            FarmerStock.status == StockStatus.ACTIVE
        ).offset(skip).limit(limit).all()
        
        result = []
        for stock in stocks:
            result.append({
                "id": stock.id,
                "product_name": stock.product.name,
                "quantity": float(stock.quantity),
                "unit": "kg",  # Default unit, can be extended
                "farmer_id": stock.farmer_user_id,
                "farmer_name": stock.farmer_user.username,
                "shop_id": stock.shop_id,
                "date": stock.date.isoformat(),
                "status": stock.status.value
            })
        return result
    
    @staticmethod
    def create_stock(db: Session, shop_id: int, farmer_user_id: int, product_id: int, quantity: float, stock_date: date = None) -> FarmerStock:
        if stock_date is None:
            stock_date = date.today()
            
        stock = FarmerStock(
            shop_id=shop_id,
            farmer_user_id=farmer_user_id,
            product_id=product_id,
            quantity=quantity,
            date=stock_date
        )
        db.add(stock)
        db.commit()
        db.refresh(stock)
        return stock
    
    @staticmethod
    def update_stock(db: Session, stock_id: int, **kwargs) -> Optional[FarmerStock]:
        stock = db.query(FarmerStock).filter(FarmerStock.id == stock_id).first()
        if stock:
            for key, value in kwargs.items():
                if hasattr(stock, key):
                    setattr(stock, key, value)
            db.commit()
            db.refresh(stock)
        return stock