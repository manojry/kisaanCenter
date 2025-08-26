from sqlalchemy.orm import Session
from ..models.order import Order
from ..schemas import OrderCreate, OrderUpdate
from typing import Optional, List

class OrderCRUD:
    @staticmethod
    def create(db: Session, order_data: OrderCreate) -> Order:
        """Create a new order record"""
        order = Order(
            product_id=order_data.product_id,
            shop_id=order_data.shop_id,
            buyer_id=order_data.buyer_id,
            quantity=order_data.quantity,
            total_price=order_data.total_price,
            status=getattr(order_data, 'status', 'pending'),
        )
        db.add(order)
        db.flush()
        return order

    @staticmethod
    def get_by_id(db: Session, order_id: int) -> Optional[Order]:
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def get_by_buyer(db: Session, buyer_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
        return db.query(Order).filter(Order.buyer_id == buyer_id).offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, order_id: int, order_update: OrderUpdate) -> Optional[Order]:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None
        if order_update.quantity is not None:
            order.quantity = order_update.quantity
        if order_update.status:
            order.status = order_update.status
        db.flush()
        return order

    @staticmethod
    def delete(db: Session, order_id: int) -> bool:
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            db.delete(order)
            db.commit()
            return True
        return False
