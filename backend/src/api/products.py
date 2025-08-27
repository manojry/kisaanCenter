from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ProductCreate, ProductUpdate, APIResponse, PaginationParams
from ..services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])

@router.post(
    "/",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
    description="Create a new product in the system",
    response_description="Product creation result",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "name": "Wheat",
                        "category": "Grain",
                        "price": 250.00,
                        "commission_rate": 5.0,
                        "status": "active"
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Product created successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Product created successfully",
                            "data": {
                                "id": 101,
                                "name": "Wheat",
                                "category": "Grain",
                                "price": 250.00,
                                "commission_rate": 5.0,
                                "status": "active"
                            }
                        }
                    }
                }
            }
        }
    }
)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # TODO: Extract user_role from auth/session (stub: use SUPERADMIN)
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.create_product(db, product, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get(
    "/{product_id}",
    response_model=APIResponse,
    summary="Get product by ID",
    description="Retrieve a specific product by its ID",
    response_description="Product details",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Product found",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Product found",
                            "data": {
                                "id": 101,
                                "name": "Wheat",
                                "category": "Grain",
                                "price": 250.00,
                                "commission_rate": 5.0,
                                "status": "active"
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_product(product_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.get_product(db, product_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get(
    "/",
    response_model=APIResponse,
    summary="Get products with filtering and pagination",
    description="Retrieve a paginated list of products with optional filtering",
    response_description="Paginated product list",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Products retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Products retrieved",
                            "data": [
                                {
                                    "id": 101,
                                    "name": "Wheat",
                                    "category": "Grain",
                                    "price": 250.00,
                                    "commission_rate": 5.0,
                                    "status": "active"
                                }
                            ],
                            "pagination": {
                                "total": 50,
                                "page": 1,
                                "limit": 10,
                                "total_pages": 5
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.get_products(db, pagination, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put("/{product_id}", response_model=APIResponse)
def update_product(
    product_id: int = Path(..., gt=0),
    product_update: ProductUpdate = ...,
    db: Session = Depends(get_db)
):
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.update_product(db, product_id, product_update, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.delete("/{product_id}", response_model=APIResponse)
def delete_product(product_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = ProductService.delete_product(db, product_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result
