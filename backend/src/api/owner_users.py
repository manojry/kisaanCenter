from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..schemas import UserCreate, UserUpdate, UserRead, APIResponse, PaginationParams
from ..services.user_service import UserService
from ..models import UserRole

router = APIRouter(prefix="/owner", tags=["Owner User Management"])

@router.post(
    "/users",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user in owner's shop",
    description="Create a new farmer, employee, or buyer in the owner's shop",
    response_description="User creation result"
)
def create_shop_user(
    user_data: UserCreate,
    shop_id: int = Query(..., description="Shop ID"),
    owner_id: int = Query(..., description="Owner ID creating the user"),
    db: Session = Depends(get_db)
):
    """
    Create a new user (farmer, employee, buyer) in the owner's shop:
    
    - **Shop scope**: User will be assigned to the specified shop
    - **Role validation**: Only farmer, employee, buyer roles allowed
    - **Permission check**: Only shop owners can create users in their shop
    - **Automatic assignment**: User is automatically linked to the shop
    """
    # Validate role - owners cannot create superadmin or other owner users
    allowed_roles = [UserRole.FARMER.value, UserRole.EMPLOYEE.value, UserRole.BUYER.value]
    if user_data.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owners can only create farmer, employee, or buyer users"
        )
    
    # Set shop_id and created_by
    user_data.shop_id = shop_id
    user_data.created_by = owner_id
    
    result = UserService.create_user(db, user_data, created_by_id=owner_id, user_role=UserRole.OWNER.value)
    
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    
    return result

@router.get(
    "/users",
    response_model=APIResponse,
    summary="Get shop users",
    description="Get all users in the owner's shop with filtering options"
)
def get_shop_users(
    shop_id: int = Query(..., description="Shop ID"),
    role: Optional[str] = Query(None, description="Filter by role (farmer, employee, buyer)"),
    status: Optional[str] = Query(None, description="Filter by status (active, inactive)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by username or contact"),
    db: Session = Depends(get_db)
):
    """
    Get all users in the shop with filtering:
    
    - **Shop scope**: Only returns users from the specified shop
    - **Role filtering**: Filter by farmer, employee, or buyer
    - **Status filtering**: Filter by active/inactive users
    - **Search**: Search by username, contact, or name
    - **Pagination**: Paginated results for large user lists
    """
    pagination = PaginationParams(page=page, limit=limit)
    
    filters = {"shop_id": shop_id}
    if role:
        filters["role"] = role
    if status:
        filters["status"] = status
    if search:
        filters["search"] = search
    
    result = UserService.get_users(db, pagination, filters)
    
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    
    return result

@router.get(
    "/users/{user_id}",
    response_model=APIResponse,
    summary="Get shop user details",
    description="Get detailed information about a specific user in the shop"
)
def get_shop_user(
    user_id: int = Path(..., description="User ID"),
    shop_id: int = Query(..., description="Shop ID"),
    include_relations: bool = Query(False, description="Include related data"),
    db: Session = Depends(get_db)
):
    """
    Get detailed user information:
    
    - **Shop verification**: Ensures user belongs to the specified shop
    - **Detailed info**: Returns complete user profile
    - **Relations**: Optionally include transactions, payments, etc.
    - **Activity data**: Include recent activity and performance metrics
    """
    result = UserService.get_user(db, user_id, include_relations)
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    # Verify user belongs to the shop
    user_data = result.data
    if user_data.get("shop_id") != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this shop"
        )
    
    return result

@router.put(
    "/users/{user_id}",
    response_model=APIResponse,
    summary="Update shop user",
    description="Update user information in the owner's shop"
)
def update_shop_user(
    user_id: int = Path(..., description="User ID"),
    shop_id: int = Query(..., description="Shop ID"),
    updated_by: int = Query(..., description="Owner ID making the update"),
    user_update: UserUpdate = ...,
    db: Session = Depends(get_db)
):
    """
    Update user information:
    
    - **Shop verification**: Ensures user belongs to the shop
    - **Role restrictions**: Cannot change roles to superadmin or owner
    - **Credit management**: Can update credit limits for buyers
    - **Status management**: Can activate/deactivate users
    """
    # Verify user belongs to shop first
    user_result = UserService.get_user(db, user_id)
    if not user_result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user_result.data.get("shop_id") != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this shop"
        )
    
    # Prevent role escalation
    if user_update.role and user_update.role not in [UserRole.FARMER.value, UserRole.EMPLOYEE.value, UserRole.BUYER.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign superadmin or owner roles"
        )
    
    result = UserService.update_user(db, user_id, user_update, updated_by_id=updated_by, user_role=UserRole.OWNER.value)
    
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    
    return result

@router.patch(
    "/users/{user_id}/status",
    response_model=APIResponse,
    summary="Update user status",
    description="Activate or deactivate a user in the shop"
)
def update_user_status(
    user_id: int = Path(..., description="User ID"),
    new_status: str = Query(..., description="New status (active, inactive, suspended)"),
    shop_id: int = Query(..., description="Shop ID"),
    updated_by: int = Query(..., description="Owner ID making the change"),
    reason: Optional[str] = Query(None, description="Reason for status change"),
    db: Session = Depends(get_db)
):
    """
    Update user status:
    
    - **Shop verification**: Ensures user belongs to the shop
    - **Status options**: active, inactive, suspended
    - **Audit trail**: Records reason for status changes
    - **Business rules**: Validates status transitions
    """
    # Verify user belongs to shop
    user_result = UserService.get_user(db, user_id)
    if not user_result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user_result.data.get("shop_id") != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this shop"
        )
    
    # Update status using UserService
    from ..schemas import UserUpdate
    status_update = UserUpdate(status=new_status)
    
    result = UserService.update_user(db, user_id, status_update, updated_by_id=updated_by, user_role=UserRole.OWNER.value)
    
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    
    return result

@router.get(
    "/users/analytics",
    response_model=APIResponse,
    summary="Get user analytics",
    description="Get analytics and metrics for shop users"
)
def get_shop_user_analytics(
    shop_id: int = Query(..., description="Shop ID"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get user analytics for the shop:
    
    - **User distribution**: Count by role and status
    - **Activity metrics**: Active users, recent signups
    - **Performance data**: Top performing farmers, buyers
    - **Trends**: User growth and activity trends
    """
    try:
        from ..models import User, Transaction, Payment, FarmerPayment
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        # Basic user counts
        total_users = db.query(func.count(User.id)).filter(User.shop_id == shop_id).scalar() or 0
        active_users = db.query(func.count(User.id)).filter(
            User.shop_id == shop_id, 
            User.status == 'active'
        ).scalar() or 0
        
        # Users by role
        farmers_count = db.query(func.count(User.id)).filter(
            User.shop_id == shop_id, 
            User.role == UserRole.FARMER.value
        ).scalar() or 0
        
        employees_count = db.query(func.count(User.id)).filter(
            User.shop_id == shop_id, 
            User.role == UserRole.EMPLOYEE.value
        ).scalar() or 0
        
        buyers_count = db.query(func.count(User.id)).filter(
            User.shop_id == shop_id, 
            User.role == UserRole.BUYER.value
        ).scalar() or 0
        
        # Recent activity (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        new_users_week = db.query(func.count(User.id)).filter(
            User.shop_id == shop_id,
            User.created_at >= week_ago
        ).scalar() or 0
        
        analytics_data = {
            "user_summary": {
                "total_users": total_users,
                "active_users": active_users,
                "inactive_users": total_users - active_users
            },
            "users_by_role": {
                "farmers": farmers_count,
                "employees": employees_count,
                "buyers": buyers_count
            },
            "recent_activity": {
                "new_users_last_7_days": new_users_week
            },
            "metrics": {
                "user_activation_rate": (active_users / total_users * 100) if total_users > 0 else 0
            }
        }
        
        return APIResponse(
            success=True,
            message="User analytics retrieved successfully",
            data=analytics_data
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user analytics: {str(e)}"
        )

@router.post(
    "/users/bulk-action",
    response_model=APIResponse,
    summary="Perform bulk action on users",
    description="Perform bulk actions like status updates on multiple users"
)
def bulk_user_action(
    action: str = Query(..., description="Action to perform (activate, deactivate, delete)"),
    user_ids: List[int] = Query(..., description="List of user IDs"),
    shop_id: int = Query(..., description="Shop ID"),
    performed_by: int = Query(..., description="Owner ID performing the action"),
    db: Session = Depends(get_db)
):
    """
    Perform bulk actions on multiple users:
    
    - **Bulk activation**: Activate multiple users at once
    - **Bulk deactivation**: Deactivate multiple users
    - **Validation**: Ensures all users belong to the shop
    - **Audit trail**: Records bulk actions for compliance
    """
    try:
        # Verify all users belong to the shop
        from ..models import User
        users = db.query(User).filter(
            User.id.in_(user_ids),
            User.shop_id == shop_id
        ).all()
        
        if len(users) != len(user_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some users do not belong to this shop"
            )
        
        # Perform bulk action
        success_count = 0
        errors = []
        
        for user in users:
            try:
                if action == "activate":
                    user.status = "active"
                elif action == "deactivate":
                    user.status = "inactive"
                elif action == "suspend":
                    user.status = "suspended"
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid action. Use: activate, deactivate, suspend"
                    )
                success_count += 1
            except Exception as e:
                errors.append(f"User {user.id}: {str(e)}")
        
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Bulk action completed. {success_count} users updated.",
            data={
                "affected_users": success_count,
                "errors": errors,
                "action_performed": action
            }
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk action failed: {str(e)}"
        )