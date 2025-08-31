from sqlalchemy.orm import Session
from ..models import FarmerStock
from datetime import date

def create_or_update_farmer_stock(db: Session, shop_id: int, farmer_user_id: int, product_id: int, quantity: float, status: str = "in_stock", stock_date: date = None):
    stock_date = stock_date or date.today()
    stock = db.query(FarmerStock).filter_by(
        shop_id=shop_id,
        farmer_user_id=farmer_user_id,
        product_id=product_id,
        date=stock_date
    ).first()
    if stock:
        stock.quantity += quantity
        db.flush()
        return stock
    else:
        stock = FarmerStock(
            shop_id=shop_id,
            farmer_user_id=farmer_user_id,
            product_id=product_id,
            quantity=quantity,
            status=status,
            date=stock_date
        )
        db.add(stock)
        db.flush()
        return stock
