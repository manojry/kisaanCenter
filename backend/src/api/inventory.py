from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import InventoryCreate, APIResponse, InventoryUpdate
from ..services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(inventory: InventoryCreate, db: Session = Depends(get_db)):
    # TODO: Extract user_role from auth/session (stub: use SUPERADMIN)
    user_role = "superadmin"  # Replace with actual role extraction
    result = InventoryService.create_inventory(db, inventory, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{inventory_id}", response_model=APIResponse)
def get_inventory(inventory_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    from ..crud.inventory_crud import InventoryCRUD
    inventory = InventoryCRUD.get_by_id(db, inventory_id)
    if not inventory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory not found")
    # Permission check (stub)
    if user_role not in ["superadmin", "owner"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    return APIResponse(success=True, message="Inventory retrieved.", data={"inventory": inventory})

@router.put("/{inventory_id}", response_model=APIResponse)
def update_inventory(inventory_id: int = Path(..., gt=0), inventory_update: InventoryUpdate = ..., db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    from ..crud.inventory_crud import InventoryCRUD
    if user_role not in ["superadmin", "owner"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    try:
        inventory = InventoryCRUD.update(db, inventory_id, inventory_update)
        db.commit()
        if not inventory:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory not found")
        return APIResponse(success=True, message="Inventory updated.", data={"inventory": inventory})
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{inventory_id}", response_model=APIResponse)
def delete_inventory(inventory_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    from ..crud.inventory_crud import InventoryCRUD
    if user_role not in ["superadmin", "owner"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    try:
        success = InventoryCRUD.delete(db, inventory_id)
        if success:
            return APIResponse(success=True, message="Inventory deleted.")
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory not found")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
