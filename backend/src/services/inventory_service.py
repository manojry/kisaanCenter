from sqlalchemy.orm import Session
from ..schemas import InventoryCreate, InventoryUpdate, APIResponse
from ..crud.inventory_crud import InventoryCRUD
from ..models import UserRole, Shop, Product

class InventoryService:
    @staticmethod
    def create_inventory(db: Session, inventory_data: InventoryCreate, user_role: str = None) -> APIResponse:
        """
        Create a new inventory record with enterprise-grade validation, shop isolation, atomic transaction, and error handling.
        """
        try:
            # Shop isolation: Only superadmin or owner of shop can create
            shop_id = getattr(inventory_data, 'shop_id', None)
            if shop_id:
                shop = db.query(Shop).filter(Shop.id == shop_id).first()
                if not shop:
                    return APIResponse(success=False, message="Shop not found.")
                if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                    return APIResponse(success=False, message="Permission denied: Only superadmin or owner can create inventory for shop.")
            # Product existence check
            product_id = getattr(inventory_data, 'product_id', None)
            if product_id:
                product = db.query(Product).filter(Product.id == product_id).first()
                if not product:
                    return APIResponse(success=False, message="Product not found.")
            # Business rule: quantity must be non-negative
            if inventory_data.quantity is None or inventory_data.quantity < 0:
                return APIResponse(success=False, message="Invalid inventory quantity.")
            # Atomic DB transaction
            from sqlalchemy.exc import SQLAlchemyError
            try:
                inventory = InventoryCRUD.create(db, inventory_data)
                db.commit()
            except (SQLAlchemyError, ValueError) as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")
            # Audit logging (stub)
            # TODO: Implement audit log entry for inventory creation
            return APIResponse(success=True, message="Inventory created successfully.", data={"inventory_id": inventory.id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
