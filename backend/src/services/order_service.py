from sqlalchemy.orm import Session
from ..schemas import OrderCreate, APIResponse
from ..crud.order_crud import OrderCRUD
from ..crud.inventory_crud import InventoryCRUD
from ..models import UserRole, Shop, Product

class OrderService:
    @staticmethod
    def create_order(db: Session, order_data: OrderCreate, user_role: str = None) -> APIResponse:
        """
        Create a new order with inventory check and atomic stock decrement.
        """
        try:
            # Shop isolation: Only superadmin or owner of shop can create
            shop_id = getattr(order_data, 'shop_id', None)
            if shop_id:
                shop = db.query(Shop).filter(Shop.id == shop_id).first()
                if not shop:
                    return APIResponse(success=False, message="Shop not found.")
                if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                    return APIResponse(success=False, message="Permission denied: Only superadmin or owner can create orders for shop.")
            # Product existence check
            product_id = getattr(order_data, 'product_id', None)
            if product_id:
                product = db.query(Product).filter(Product.id == product_id).first()
                if not product:
                    return APIResponse(success=False, message="Product not found.")
            # Inventory check
            inventory = InventoryCRUD.get_by_product_shop(db, order_data.product_id, order_data.shop_id)
            if not inventory or inventory.quantity < order_data.quantity:
                return APIResponse(success=False, message="Insufficient inventory.")
            # Atomic DB transaction
            from sqlalchemy.exc import SQLAlchemyError
            try:
                # Decrement inventory
                inventory.quantity -= order_data.quantity
                db.flush()
                # Create order
                order = OrderCRUD.create(db, order_data)
                db.commit()
            except (SQLAlchemyError, ValueError) as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")
            # Audit logging (stub)
            # TODO: Implement audit log entry for order creation
            return APIResponse(success=True, message="Order created successfully.", data={"order_id": order.id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
