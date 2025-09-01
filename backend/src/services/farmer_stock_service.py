from sqlalchemy.orm import Session
from ..models.models import FarmerStock

class FarmerStockService:
    def declare_stock(self, db: Session, farmer_id: int, product_id: int, declared_qty: float, price: float):
        stock = db.query(FarmerStock).filter_by(farmer_user_id=farmer_id, product_id=product_id).first()
        if not stock:
            stock = FarmerStock(farmer_user_id=farmer_id, product_id=product_id, declared_qty=declared_qty, sold_qty=0, balance_qty=declared_qty, price=price)
            db.add(stock)
        else:
            stock.declared_qty = declared_qty
            stock.balance_qty = declared_qty - (stock.sold_qty or 0)
        db.commit()
        return stock

    def create_implicit_stock(self, db: Session, farmer_id: int, product_id: int, sold_qty: float, price: float):
        stock = FarmerStock(farmer_user_id=farmer_id, product_id=product_id, declared_qty=None, sold_qty=sold_qty, balance_qty=None, price=price)
        db.add(stock)
        db.commit()
        return stock

    def get_farmer_balance(self, db: Session, farmer_id: int):
        stocks = db.query(FarmerStock).filter_by(farmer_user_id=farmer_id).all()
        return sum([(s.balance_qty or 0) for s in stocks])
