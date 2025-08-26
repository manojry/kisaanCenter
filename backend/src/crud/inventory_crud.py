from sqlalchemy.orm import Session
from ..models.inventory import Inventory
from ..schemas import InventoryCreate, InventoryUpdate
from typing import Optional, List

class InventoryCRUD:
    @staticmethod
    def create(db: Session, inventory_data: InventoryCreate) -> Inventory:
        """Create a new inventory record"""
        if inventory_data.quantity is None or inventory_data.quantity < 0:
            raise ValueError("Invalid inventory quantity")
        inventory = Inventory(
            product_id=inventory_data.product_id,
            shop_id=inventory_data.shop_id,
            quantity=inventory_data.quantity,
            status=getattr(inventory_data, 'status', 'active'),
        )
        db.add(inventory)
        db.flush()
        return inventory

    @staticmethod
    def get_by_id(db: Session, inventory_id: int) -> Optional[Inventory]:
        return db.query(Inventory).filter(Inventory.id == inventory_id).first()

    @staticmethod
    def get_by_product_shop(db: Session, product_id: int, shop_id: int) -> Optional[Inventory]:
        return db.query(Inventory).filter(
            Inventory.product_id == product_id,
            Inventory.shop_id == shop_id
        ).first()

    @staticmethod
    def update(db: Session, inventory_id: int, inventory_update: InventoryUpdate) -> Optional[Inventory]:
        inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
        if not inventory:
            return None
        if inventory_update.quantity is not None:
            inventory.quantity = inventory_update.quantity
        if inventory_update.status:
            inventory.status = inventory_update.status
        db.flush()
        return inventory

    @staticmethod
    def delete(db: Session, inventory_id: int) -> bool:
        inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
        if inventory:
            db.delete(inventory)
            db.commit()
            return True
        return False
