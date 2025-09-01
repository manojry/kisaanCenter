from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.src.database import get_db
from backend.src.schemas import ShopCreateRequest, UserCreateRequest, ProductAssignRequest, APIResponse
from backend.src.services.shop_service import ShopService
from backend.src.services.user_service import UserService
from backend.src.services.product_service import ProductService
from backend.src.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/owner-admin", tags=["Owner Admin"])

# Add users (farmers/buyers) to shop - Owner can do this for their shop
@router.post("/shops/{shop_id}/users", response_model=APIResponse)
def add_users_to_shop(
	shop_id: int,
	users_data: list[UserCreateRequest],
	db: Session = Depends(get_db)
):
	"""Owner/admin adds users to shop"""
	result = UserService(db).add_users_to_shop(shop_id, users_data)
	return result

# Assign products to shop
@router.post("/shops/{shop_id}/products", response_model=APIResponse)
def assign_products_to_shop(
	shop_id: int,
	product_data: ProductAssignRequest,
	db: Session = Depends(get_db)
):
	"""Owner/admin assigns products to shop"""
	result = ProductService(db).assign_products_to_shop(shop_id, product_data)
	return result

# Basic shop analytics
@router.get("/shops/{shop_id}/analytics", response_model=APIResponse)
def get_shop_analytics(
	shop_id: int,
	db: Session = Depends(get_db)
):
	"""Owner/admin views shop analytics"""
	result = AnalyticsService(db).get_shop_analytics(shop_id)
	return result

# Get users for a shop with optional role filter
@router.get("/shops/{shop_id}/users", response_model=APIResponse)
def get_shop_users(
	shop_id: int,
	role: str = Query(None, description="Filter by user role (farmer, buyer, employee)"),
	db: Session = Depends(get_db)
):
	"""Get users for a shop, optionally filtered by role"""
	users = UserService(db).get_users_by_shop(shop_id, role)
	return APIResponse(success=True, message="Users retrieved", data=users)

# Get products for a shop
@router.get("/shops/{shop_id}/products", response_model=APIResponse)
def get_shop_products(
	shop_id: int,
	db: Session = Depends(get_db)
):
	"""Get products for a shop"""
	products = ProductService(db).get_products_by_shop(shop_id)
	return APIResponse(success=True, message="Products retrieved", data=products)

# Activate/Deactivate user
@router.patch("/shops/{shop_id}/users/{user_id}/status", response_model=APIResponse)
def update_user_status(
	shop_id: int,
	user_id: int,
	status: str,
	db: Session = Depends(get_db)
):
	"""Activate or deactivate a user in the shop"""
	user = UserService.update_user(db, user_id, status=status)
	if user:
		return APIResponse(success=True, message=f"User status updated to {status}", data={"user_id": user_id, "status": status})
	return APIResponse(success=False, message="User not found or update failed", data=None)

# Delete user from shop
@router.delete("/shops/{shop_id}/users/{user_id}", response_model=APIResponse)
def delete_user_from_shop(
	shop_id: int,
	user_id: int,
	db: Session = Depends(get_db)
):
	"""Delete a user from the shop"""
	success = UserService.delete_user(db, user_id)
	if success:
		return APIResponse(success=True, message="User deleted", data={"user_id": user_id})
	return APIResponse(success=False, message="User not found or delete failed", data=None)

# Reset user password
@router.patch("/shops/{shop_id}/users/{user_id}/password", response_model=APIResponse)
def reset_user_password(
	shop_id: int,
	user_id: int,
	new_password: str,
	db: Session = Depends(get_db)
):
	"""Reset password for a user in the shop"""
	import hashlib
	password_hash = hashlib.sha256(new_password.encode()).hexdigest()
	user = UserService.update_user(db, user_id, password_hash=password_hash)
	if user:
		return APIResponse(success=True, message="Password reset successful", data={"user_id": user_id})
	return APIResponse(success=False, message="User not found or password reset failed", data=None)

# Set shop commission rate
@router.patch("/shops/{shop_id}/commission", response_model=APIResponse)
def set_shop_commission(
	shop_id: int,
	commission_rate: float,
	db: Session = Depends(get_db)
):
	"""Owner sets commission percentage for their shop"""
	shop = ShopService(db).get_shop_by_id(shop_id)
	if not shop:
		return APIResponse(success=False, message="Shop not found", data=None)
	shop.commission_rate = commission_rate
	db.commit()
	return APIResponse(success=True, message="Commission rate updated", data={"shop_id": shop_id, "commission_rate": commission_rate})
