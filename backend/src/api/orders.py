from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import OrderCreate, APIResponse, OrderUpdate
from ..services.order_service import OrderService
from ..crud.order_crud import OrderCRUD

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
@router.post(
    "/",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "buyer_id": 1,
                        "product_id": 1,
                        "quantity": 10,
                        "price": 500.0,
                        "status": "pending"
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Order created successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Order created.",
                            "data": {"order_id": 301}
                        }
                    }
                }
            },
            "400": {"description": "Invalid input or business rule violation."}
        }
    }
)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # TODO: Extract user_role from auth/session (stub: use SUPERADMIN)
    user_role = "superadmin"  # Replace with actual role extraction
    result = OrderService.create_order(db, order, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{order_id}", response_model=APIResponse)
@router.get(
    "/{order_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "order_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 301}}
        ],
        "responses": {
            "200": {
                "description": "Order retrieved successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Order retrieved.",
                            "data": {"order": {"order_id": 301, "buyer_id": 1, "product_id": 1, "quantity": 10, "price": 500.0, "status": "pending"}}
                        }
                    }
                }
            },
            "404": {"description": "Order not found."}
        }
    }
)
def get_order(order_id: int, db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    order = OrderCRUD.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    # Permission check (stub)
    if user_role not in ["superadmin", "owner"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    return APIResponse(success=True, message="Order retrieved.", data={"order": order})

@router.put("/{order_id}", response_model=APIResponse)
@router.put(
    "/{order_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "order_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 301}}
        ],
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "quantity": 12,
                        "price": 600.0,
                        "status": "confirmed"
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Order updated successfully.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Order updated.",
                            "data": {"order_id": 301, "quantity": 12, "price": 600.0, "status": "confirmed"}
                        }
                    }
                }
            },
            "404": {"description": "Order not found."}
        }
    }
)
def update_order(order_id: int, order_update: OrderUpdate, db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    if user_role not in ["superadmin", "owner"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    try:
        order = OrderCRUD.update(db, order_id, order_update)
        db.commit()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return APIResponse(success=True, message="Order updated.", data={"order": order})
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{order_id}", response_model=APIResponse)
@router.delete(
    "/{order_id}",
    response_model=APIResponse,
    openapi_extra={
        "parameters": [
            {"name": "order_id", "in": "path", "required": True, "schema": {"type": "integer", "example": 301}}
        ],
        "responses": {
            "200": {
                "description": "Order deleted successfully.",
                "content": {
                    "application/json": {
                        "example": {"success": True, "message": "Order deleted."}
                    }
                }
            },
            "404": {"description": "Order not found."}
        }
    }
)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    if user_role not in ["superadmin", "owner"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    try:
        success = OrderCRUD.delete(db, order_id)
        if success:
            return APIResponse(success=True, message="Order deleted.")
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
