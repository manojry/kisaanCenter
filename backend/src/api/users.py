from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..schemas import (
    UserCreate, UserUpdate, UserRead, UserReadWithRelations,
    PaginationParams, APIResponse, ErrorResponse
)
from ..services.user_service import UserService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

@router.post(
    "/",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
    description="Create a new user in the system with comprehensive validation",
    response_description="User creation result",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "username": "farmer_john",
                        "password": "secure_password",
                        "role": "farmer",
                        "shop_id": 1,
                        "contact": "+91-9876543210",
                        "credit_limit": 10000.00,
                        "created_by": 2,
                        "status": "active"
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "User created successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "User created successfully",
                            "data": {
                                "id": 123,
                                "username": "farmer_john",
                                "role": "farmer",
                                "shop_id": 1,
                                "contact": "+91-9876543210",
                                "credit_limit": 10000.00,
                                "status": "active",
                                "created_by": 2
                            }
                        }
                    }
                }
            }
        }
    }
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    created_by_id: Optional[int] = Query(None, description="ID of user creating this record")
):
    """
    Create a new user with full business validation:
    
    - **username**: Unique username (3-50 characters)
    - **password**: Secure password (min 8 characters)
    - **role**: User role (superadmin, owner, farmer, buyer, employee)
    - **shop_id**: Required for non-superadmin users
    - **contact**: Optional contact information
    - **credit_limit**: Optional credit limit for buyers/farmers
    """
    result = UserService.create_user(db, user, created_by_id)
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": result.message,
                "errors": result.errors
            }
        )
    
    return result

@router.get(
    "/{user_id}",
    response_model=APIResponse,
    summary="Get user by ID",
    description="Retrieve a specific user by their ID",
    response_description="User details",
    openapi_extra={
        "responses": {
            "200": {
                "description": "User found",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "User found",
                            "data": {
                                "id": 123,
                                "username": "farmer_john",
                                "role": "farmer",
                                "shop_id": 1,
                                "contact": "+91-9876543210",
                                "credit_limit": 10000.00,
                                "status": "active",
                                "created_by": 2
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_user(
    user_id: int = Path(..., description="User ID to retrieve", gt=0),
    include_relations: bool = Query(False, description="Include related entities (shop, transactions, credits)"),
    db: Session = Depends(get_db)
):
    """
    Get user by ID with optional relationship data:
    
    - **user_id**: Valid user ID (positive integer)
    - **include_relations**: Whether to include shop, transactions, and credits data
    """
    result = UserService.get_user(db, user_id, include_relations)
    
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    
    return result

@router.get(
    "/",
    response_model=APIResponse,
    summary="Get users with filtering and pagination",
    description="Retrieve a paginated list of users with optional filtering",
    response_description="Paginated user list",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Users retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Users retrieved",
                            "data": [
                                {
                                    "id": 123,
                                    "username": "farmer_john",
                                    "role": "farmer",
                                    "shop_id": 1,
                                    "contact": "+91-9876543210",
                                    "credit_limit": 10000.00,
                                    "status": "active",
                                    "created_by": 2
                                }
                            ],
                            "pagination": {
                                "total": 100,
                                "page": 1,
                                "limit": 10,
                                "total_pages": 10
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_users(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    shop_id: Optional[int] = Query(None, description="Filter by shop ID"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    user_status: Optional[str] = Query(None, description="Filter by user status"),
    search: Optional[str] = Query(None, description="Search in username and contact"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """
    Get paginated users with comprehensive filtering:
    
    - **Pagination**: page (1-based) and limit (1-100)
    - **Filters**: shop_id, role, status, search term
    - **Sorting**: Configurable by any field with asc/desc order
    - **Search**: Full-text search in username and contact fields
    """
    pagination = PaginationParams(page=page, limit=limit)
    
    result = UserService.get_users(
        db=db,
        pagination=pagination,
        shop_id=shop_id,
        role=role,
        status=user_status,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    return result

@router.put("/{user_id}",
            response_model=APIResponse,
            summary="Update user",
            description="Update user information with validation")
def update_user(
    user_id: int = Path(..., description="User ID to update", gt=0),
    user_update: UserUpdate = ...,
    updated_by_id: Optional[int] = Query(None, description="ID of user making the update"),
    db: Session = Depends(get_db)
):
    """
    Update user with business validation:
    
    - **user_id**: Valid user ID to update
    - **Updatable fields**: username, contact, credit_limit, status
    - **Validation**: Comprehensive business rule validation
    - **Audit**: Tracks who made the update and when
    """
    result = UserService.update_user(db, user_id, user_update, updated_by_id)
    
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail={
            "message": result.message,
            "errors": result.errors
        })
    
    return result

@router.delete("/{user_id}",
               response_model=APIResponse,
               summary="Delete user",
               description="Soft delete user with business rule validation")
def delete_user(
    user_id: int = Path(..., description="User ID to delete", gt=0),
    db: Session = Depends(get_db)
):
    """
    Soft delete user (set status to inactive):
    
    - **user_id**: Valid user ID to delete
    - **Business rules**: Validates deletion is allowed
    - **Soft delete**: User is marked inactive, not permanently removed
    - **Data integrity**: Preserves relationships and audit trail
    """
    result = UserService.delete_user(db, user_id)
    
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail={
            "message": result.message,
            "errors": result.errors
        })
    
    return result

# Authentication endpoints
@router.post("/auth/login",
             response_model=APIResponse,
             summary="Authenticate user",
             description="Authenticate user credentials")
def login_user(
    username: str = Query(..., description="Username"),
    password: str = Query(..., description="Password"),
    db: Session = Depends(get_db)
):
    """
    Authenticate user credentials:
    
    - **username**: Valid username
    - **password**: User password
    - **Returns**: User data if authentication successful
    - **Security**: Password is hashed and verified securely
    """
    result = UserService.authenticate_user(db, username, password)
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.message,
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return result

# Business-specific endpoints
@router.get("/shop/{shop_id}",
            response_model=APIResponse,
            summary="Get users by shop",
            description="Get all users belonging to a specific shop")
def get_users_by_shop(
    shop_id: int = Path(..., description="Shop ID", gt=0),
    active_only: bool = Query(True, description="Only return active users"),
    db: Session = Depends(get_db)
):
    """
    Get users for a specific shop:
    
    - **shop_id**: Valid shop ID
    - **active_only**: Filter for active users only
    - **Returns**: List of users in the shop
    """
    try:
        from ..crud.user_crud import UserCRUD
        users = UserCRUD.get_by_shop(db, shop_id, active_only)
        users_data = [UserRead.model_validate(user) for user in users]
        
        return APIResponse(
            success=True,
            message=f"Found {len(users_data)} users for shop {shop_id}",
            data=users_data
        )
    except Exception as e:
        logger.error(f"Failed to get users for shop {shop_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users for shop"
        )

@router.get("/farmers/with-stock/{shop_id}",
            response_model=APIResponse,
            summary="Get farmers with active stock",
            description="Get farmers who have active stock in the shop")
def get_farmers_with_stock(
    shop_id: int = Path(..., description="Shop ID", gt=0),
    db: Session = Depends(get_db)
):
    """
    Get farmers with active stock:
    
    - **shop_id**: Valid shop ID
    - **Returns**: List of farmers who have active stock
    - **Business logic**: Only farmers with quantity > 0
    """
    try:
        from ..crud.user_crud import UserCRUD
        farmers = UserCRUD.get_farmers_with_stock(db, shop_id)
        farmers_data = [UserRead.model_validate(farmer) for farmer in farmers]
        
        return APIResponse(
            success=True,
            message=f"Found {len(farmers_data)} farmers with stock",
            data=farmers_data
        )
    except Exception as e:
        logger.error(f"Failed to get farmers with stock: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve farmers with stock"
        )

@router.get("/buyers/with-credit/{shop_id}",
            response_model=APIResponse,
            summary="Get buyers with outstanding credit",
            description="Get buyers who have outstanding credit")
def get_buyers_with_credit(
    shop_id: int = Path(..., description="Shop ID", gt=0),
    db: Session = Depends(get_db)
):
    """
    Get buyers with outstanding credit:
    
    - **shop_id**: Valid shop ID
    - **Returns**: List of buyers with outstanding credit
    - **Business logic**: Only buyers with outstanding or partial credit
    """
    try:
        from ..crud.user_crud import UserCRUD
        buyers = UserCRUD.get_buyers_with_credit(db, shop_id)
        buyers_data = [UserRead.model_validate(buyer) for buyer in buyers]
        
        return APIResponse(
            success=True,
            message=f"Found {len(buyers_data)} buyers with credit",
            data=buyers_data
        )
    except Exception as e:
        logger.error(f"Failed to get buyers with credit: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve buyers with credit"
        )

@router.put("/{user_id}/credit-limit",
            response_model=APIResponse,
            summary="Update user credit limit",
            description="Update credit limit for a user with business validation")
def update_credit_limit(
    user_id: int = Path(..., description="User ID", gt=0),
    new_limit: float = Query(..., description="New credit limit", ge=0),
    updated_by_id: int = Query(..., description="ID of user making the change"),
    db: Session = Depends(get_db)
):
    """
    Update user credit limit:
    
    - **user_id**: Valid user ID
    - **new_limit**: New credit limit (must be >= 0)
    - **updated_by_id**: ID of user making the change
    - **Validation**: Business rules for credit limit changes
    """
    try:
        from ..crud.user_crud import UserCRUD
        user = UserCRUD.update_credit_limit(db, user_id, new_limit, updated_by_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        db.commit()
        
        return APIResponse(
            success=True,
            message="Credit limit updated successfully",
            data=UserRead.model_validate(user)
        )
        
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update credit limit: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update credit limit"
        )
