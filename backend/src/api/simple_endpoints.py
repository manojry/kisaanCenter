
"""
Simple Working API Endpoints
Direct database queries without complex service layers
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from fastapi import Request
from sqlalchemy.orm import Session
from ..models.user import User
from sqlalchemy import text
from typing import Optional, List, Dict, Any
from ..schemas.user_schemas import UserCreate, UserRead
from datetime import datetime
import hashlib
import logging
import psycopg2
from ..database import get_db

logger = logging.getLogger(__name__)

# Create routers for different endpoint groups
users_router = APIRouter(tags=["Users"])
shops_router = APIRouter(tags=["Shops"])
products_router = APIRouter(tags=["Products"])
transactions_router = APIRouter(tags=["Transactions"])
payments_router = APIRouter(tags=["Payments"])
credits_router = APIRouter(tags=["Credits"])

def success_response(message: str, data: Any = None) -> Dict:
    """Standard success response format"""
    return {
        "success": True,
        "message": message,
        "data": data
    }

def hash_password(password: str) -> str:
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

from ..features.auth.services.auth_service import AuthService
from ..schemas import APIResponse
from fastapi import Body

# USER ENDPOINTS

@users_router.post("/login", response_model=APIResponse, summary="Login with JSON body")
def login_user_json(
    payload: dict = Body(..., examples={
        "default": {
            "summary": "Superadmin login",
            "value": {"username": "superadmin", "password": "admin123"}
        }
    }),
    db: Session = Depends(get_db)
):
    """
    Authenticate user credentials from JSON body and get access token.
    """
    username = payload.get("username")
    password = payload.get("password")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    result = AuthService.authenticate_user(db, username, password)
    return result

@users_router.post("/create", response_model=UserRead)
def create_user(
    user: UserCreate = Body(...),
    current_user_id: Optional[int] = None,  # In real app, this comes from JWT
    db: Session = Depends(get_db)
):
    """Create a new user with authorization checks.
    Handles both /create-user and /create-user/ routes."""
    request_id = f"legacy-create-user-{user.username}-{datetime.now().isoformat()}"
    logger.info(f"[{request_id}] - Request started: POST /legacy-create-user | Payload: {user.dict()}")
    try:
        # Authorization check - only superadmin can create owners
        logger.debug(f"[{request_id}] - Authorization check for role: {user.role}, current_user_id: {current_user_id}")
        if user.role == 'owner' and current_user_id:
            current_user = db.execute(text("SELECT role FROM users WHERE id = :id"), {"id": current_user_id}).fetchone()
            logger.debug(f"[{request_id}] - Current user role: {current_user[0] if current_user else None}")
            if current_user and current_user[0] != 'superadmin':
                logger.warning(f"[{request_id}] - Only superadmin can create owners. Attempt denied.")
                raise HTTPException(status_code=403, detail="Only superadmin can create owners")
        # Owner can only create users for their shop
        if current_user_id and user.role in ['farmer', 'buyer', 'employee']:
            current_user = db.execute(text("SELECT role, shop_id FROM users WHERE id = :id"), {"id": current_user_id}).fetchone()
            logger.debug(f"[{request_id}] - Current user role/shop: {current_user if current_user else None}")
            if current_user and current_user[0] == 'owner' and current_user[1] != user.shop_id:
                logger.warning(f"[{request_id}] - Owner can only create users for their own shop. Attempt denied.")
                raise HTTPException(status_code=403, detail="You can only create users for your own shop")
        password_hash = hash_password(user.password)
        logger.debug(f"[{request_id}] - Password hashed for user: {user.username}")
        result = db.execute(text("""
            INSERT INTO users (username, password_hash, role, shop_id, contact, credit_limit, record_status, created_by)
            VALUES (:username, :password_hash, :role, :shop_id, :contact, :credit_limit, :record_status, :created_by)
            RETURNING id, username, role, shop_id, contact, credit_limit, record_status, created_by, created_at, updated_at
        """), {
            "username": user.username,
            "password_hash": password_hash,
            "role": user.role,
            "shop_id": user.shop_id,
            "contact": user.contact,
            "credit_limit": float(user.credit_limit) if user.credit_limit else 0.0,
            "record_status": user.status.value if hasattr(user.status, 'value') else str(user.status),
            "created_by": user.created_by
        })
        created_user = result.fetchone()
        db.commit()
        logger.info(f"[{request_id}] - User created successfully: {created_user.username} (ID: {created_user.id})")
        logger.info(f"[{request_id}] - Request completed: POST /legacy-create-user")
        user_data = UserRead(
            id=created_user.id,
            username=created_user.username,
            email=None,
            full_name=None,
            role=created_user.role,
            shop_id=created_user.shop_id,
            contact=created_user.contact,
            credit_limit=float(created_user.credit_limit),
            created_at=created_user.created_at if created_user.created_at else datetime.now(),
            updated_at=created_user.updated_at if created_user.updated_at else datetime.now(),
            status=created_user.record_status
        )
        return {
            "success": True,
            "message": "User created successfully",
            "data": user_data.dict()
        }
    except Exception as e:
        db.rollback()
        # Handle duplicate username error
        if hasattr(e, 'orig') and isinstance(e.orig, psycopg2.errors.UniqueViolation):
            logger.error(f"[{request_id}] - Duplicate username error: {user.username}")
            raise HTTPException(status_code=409, detail="Username already exists")
        logger.error(f"[{request_id}] - Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")

@users_router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    try:
        result = db.execute(text("""
            SELECT id, username, role, shop_id, contact, credit_limit, record_status, created_by, created_at
            FROM users WHERE id = :user_id
        """), {"user_id": user_id})
        
        user = result.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return success_response("User found", {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "shop_id": user.shop_id,
            "contact": user.contact,
            "credit_limit": float(user.credit_limit),
            "record_status": user.record_status,
            "created_by": user.created_by,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user")

@users_router.get("/")
def get_users(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    shop_id: Optional[int] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get users with pagination"""
    try:
        logger.info(f"[GET /api/v1/users] Query params: page={page}, limit={limit}, shop_id={shop_id}, role={role}")
        offset = (page - 1) * limit
        # Build WHERE clause
        where_conditions = []
        params = {"limit": limit, "offset": offset}
        user_data = getattr(request.state, 'user', None)
        if not user_data:
            return APIResponse(success=False, message="User not authenticated")

        # Owner must send shop_id as query param
        if user_data.get('role') == 'owner':
            if not shop_id:
                return APIResponse(success=False, message="Owner must provide shop_id to fetch users")
            where_conditions = ["shop_id = :shop_id"]
            params = {"shop_id": shop_id, "limit": limit, "offset": offset}
            where_clause = "WHERE " + " AND ".join(where_conditions)
            logger.info(f"[GET /api/v1/users] OWNER WHERE clause: {where_clause} | params: {params}")
            result = db.execute(text(f"""
                SELECT id, username, role, shop_id, contact, credit_limit, record_status, created_by, created_at
                FROM users {where_clause}
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """), params)
            users = []
            for user in result.fetchall():
                users.append({
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                    "shop_id": user.shop_id,
                    "contact": user.contact,
                    "credit_limit": float(user.credit_limit),
                    "record_status": user.record_status,
                    "created_by": user.created_by,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                })
            count_result = db.execute(text(f"""
                SELECT COUNT(*) as total FROM users {where_clause}
            """), params)
            total = count_result.fetchone().total
            pagination = {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit
            }
            return success_response("Users retrieved successfully", {
                "users": users,
                "pagination": pagination
            })

            # Superadmin and other roles can fetch all users
            users_query = db.query(User)
            total = users_query.count()
            users = users_query.offset(offset).limit(limit).all()

            users_data = [
                {
                    "id": u.id,
                    "username": u.username,
                    "role": u.role.value if hasattr(u.role, 'value') else u.role,
                    "shop_id": u.shop_id,
                    "contact": u.contact,
                    "credit_limit": u.credit_limit,
                    "record_status": u.record_status,
                    "created_by": u.created_by,
                    "created_at": u.created_at.isoformat() if u.created_at else None
                }
                for u in users
            ]

            pagination = {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total // limit) + (1 if total % limit else 0)
            }

            return success_response(
                "Users retrieved successfully",
                {
                    "users": users_data,
                    "pagination": pagination
                }
            )
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users")

@users_router.put("/{user_id}")
def update_user(
    user_id: int,
    contact: Optional[str] = None,
    credit_limit: Optional[float] = None,
    record_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update user"""
    try:
        # Build SET clause
        set_conditions = []
        params = {"user_id": user_id}
        
        if contact is not None:
            set_conditions.append("contact = :contact")
            params["contact"] = contact
        
        if credit_limit is not None:
            set_conditions.append("credit_limit = :credit_limit")
            params["credit_limit"] = credit_limit
        
        if record_status is not None:
            set_conditions.append("record_status = :record_status")
            params["record_status"] = record_status
        
        if not set_conditions:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        set_clause = ", ".join(set_conditions)
        
        result = db.execute(text(f"""
            UPDATE users SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
            RETURNING id, username, role, shop_id, contact, credit_limit, record_status
        """), params)
        
        user = result.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.commit()
        
        return success_response("User updated successfully", {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "shop_id": user.shop_id,
            "contact": user.contact,
            "credit_limit": float(user.credit_limit),
            "record_status": user.record_status
        })
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")

import base64
import json
from datetime import datetime, timedelta

def create_access_token(user_id: int, username: str, role: str, shop_id: int = None) -> str:
    """Create simple access token"""
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "shop_id": shop_id,
        "exp": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "iat": datetime.utcnow().isoformat()
    }
    return base64.b64encode(json.dumps(payload).encode()).decode()

from pydantic import BaseModel
from typing import Union

class LoginRequest(BaseModel):
    username: str
    password: str

@users_router.post("/auth/login")
def login_user(
    request: Union[LoginRequest, None] = None,
    username: str = Query(None),
    password: str = Query(None),
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token"""
    try:
        # Handle both JSON body and query parameters
        if request:
            username = request.username
            password = request.password
        elif not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")

        # Debug log: print received username and masked password
        logger.info(f"Login attempt: username='{username}', password='{'*' * len(password) if password else None}'")

        password_hash = hash_password(password)

        # Check users table for all logins, including superadmin
        result = db.execute(text("""
            SELECT id, username, role, shop_id FROM users 
            WHERE username = :username AND password_hash = :password_hash AND record_status = 'active'
        """), {"username": username, "password_hash": password_hash})

        user = result.fetchone()
        if not user:
            logger.warning(f"Login failed for username='{username}' (user not found or invalid password)")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Create access token
        access_token = create_access_token(
            user_id=user.id,
            username=user.username,
            role=user.role,
            shop_id=user.shop_id
        )

        logger.info(f"Login successful for username='{username}' (id={user.id}, role={user.role})")

        return {
            "success": True,
            "message": "Authentication successful",
            "data": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "shop_id": user.shop_id,
                "user_id": user.id,
                "access_token": access_token
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error authenticating user: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@users_router.get("/shop/{shop_id}")
def get_users_by_shop(shop_id: int, db: Session = Depends(get_db)):
    """Get users by shop"""
    try:
        result = db.execute(text("""
            SELECT id, username, role, contact, credit_limit, record_status
            FROM users WHERE shop_id = :shop_id AND record_status = 'active'
            ORDER BY created_at DESC
        """), {"shop_id": shop_id})
        
        users = []
        for user in result.fetchall():
            users.append({
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "contact": user.contact,
                "credit_limit": float(user.credit_limit),
                "record_status": user.record_status
            })
        
        return success_response(f"Found {len(users)} users for shop {shop_id}", users)
        
    except Exception as e:
        logger.error(f"Error getting users by shop: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users for shop")

@users_router.put("/{user_id}/credit-limit")
def update_credit_limit(
    user_id: int,
    new_limit: float = Query(..., ge=0),
    updated_by_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update user credit limit"""
    try:
        result = db.execute(text("""
            UPDATE users SET credit_limit = :new_limit, updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
            RETURNING id, username, credit_limit
        """), {"user_id": user_id, "new_limit": new_limit})
        
        user = result.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.commit()
        
        return success_response("Credit limit updated successfully", {
            "id": user.id,
            "username": user.username,
            "credit_limit": float(user.credit_limit)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating credit limit: {e}")
        raise HTTPException(status_code=500, detail="Failed to update credit limit")

# SHOP ENDPOINTS
@shops_router.get("/by-owner/{owner_id}")
def get_shop_by_owner(owner_id: int, db: Session = Depends(get_db)):
    """Get shop by owner_id"""
    try:
        result = db.execute(text("""
            SELECT id, name, location, commission_rate, record_status as status
            FROM shops WHERE owner_id = :owner_id
        """), {"owner_id": owner_id})
        shop = result.fetchone()
        
        if not shop:
            return success_response("No shop found for owner", None)
            
        return success_response("Shop found", {
            "id": shop.id,
            "name": shop.name,
            "location": shop.location,
            "commission_rate": float(shop.commission_rate),
            "status": shop.status
        })
    except Exception as e:
        logger.error(f"Error getting shop by owner: {e}")
        raise HTTPException(status_code=400, detail="Failed to retrieve shop")

@shops_router.get("/{shop_id}")
def get_shop(shop_id: int, db: Session = Depends(get_db)):
    """Get shop by ID"""
    try:
        result = db.execute(text("""
            SELECT id, name, location, commission_rate, record_status as status
            FROM shops WHERE id = :shop_id
        """), {"shop_id": shop_id})
        shop = result.fetchone()

        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")

        return success_response("Shop found", {
            "id": shop.id,
            "name": shop.name,
            "location": shop.location,
            "commission_rate": float(shop.commission_rate),
            "status": shop.status
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting shop: {e}")
        raise HTTPException(status_code=400, detail="Failed to retrieve shop")

@shops_router.get("/")
def get_shops(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get shops with pagination"""
    try:
        offset = (page - 1) * limit
        
        result = db.execute(text("""
            SELECT id, name, location, commission_rate, record_status as status
            FROM shops
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """), {"limit": limit, "offset": offset})
        
        shops = []
        for shop in result.fetchall():
            shops.append({
                "id": shop.id,
                "name": shop.name,
                "location": shop.location,
                "commission_rate": float(shop.commission_rate),
                "status": shop.status
            })
        
        return success_response("Shops retrieved successfully", shops)
        
    except Exception as e:
        logger.error(f"Error getting shops: {e}")
        raise HTTPException(status_code=400, detail="Failed to retrieve shops")

from pydantic import BaseModel

class ShopCreateRequest(BaseModel):
    name: str
    location: str
    commission_rate: float = 5.0
    owner_user_id: int
    plan_id: int = None

@shops_router.post("/", summary="Create a new shop")
def create_shop(
    shop: ShopCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new shop"""
    try:
        result = db.execute(text("""
            INSERT INTO shops (name, location, commission_rate, owner_id, plan_id, record_status, created_at)
            VALUES (:name, :location, :commission_rate, :owner_id, :plan_id, 'active', CURRENT_TIMESTAMP)
            RETURNING id, name, location, commission_rate, owner_id, plan_id, record_status, created_at
        """), {
            "name": shop.name,
            "location": shop.location,
            "commission_rate": shop.commission_rate,
            "owner_id": shop.owner_user_id,
            "plan_id": shop.plan_id
        })
        created_shop = result.fetchone()
        # Update owner's shop_id in users table
        db.execute(text("""
            UPDATE users SET shop_id = :shop_id WHERE id = :owner_id
        """), {
            "shop_id": created_shop.id,
            "owner_id": shop.owner_user_id
        })
        db.commit()
        return success_response("Shop created successfully", {
            "id": created_shop.id,
            "name": created_shop.name,
            "location": created_shop.location,
            "commission_rate": float(created_shop.commission_rate),
            "owner_id": created_shop.owner_id,
            "plan_id": created_shop.plan_id,
            "status": created_shop.record_status,
            "created_at": created_shop.created_at.isoformat() if created_shop.created_at else None
        })
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating shop: {e}")
        raise HTTPException(status_code=500, detail="Failed to create shop")

# PRODUCT ENDPOINTS
@products_router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product by ID"""
    try:
        result = db.execute(text("""
            SELECT p.id, p.name, p.description, p.category_id, p.price, p.status,
                   c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = :product_id
        """), {"product_id": product_id})
        
        product = result.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return success_response("Product found", {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "category_id": product.category_id,
            "category_name": product.category_name,
            "price": float(product.price),
            "status": product.status
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting product: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve product")

@products_router.get("/")
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get products with pagination"""
    try:
        offset = (page - 1) * limit
        
        result = db.execute(text("""
            SELECT p.id, p.name, p.description, p.category_id, p.price, p.status,
                   c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
        """), {"limit": limit, "offset": offset})
        
        products = []
        for product in result.fetchall():
            products.append({
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "category_id": product.category_id,
                "category_name": product.category_name,
                "price": float(product.price),
                "status": product.status
            })
        
        return success_response("Products retrieved successfully", products)
        
    except Exception as e:
        logger.error(f"Error getting products: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve products")

# PAYMENT ENDPOINTS
@payments_router.get("/")
def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get payments with pagination"""
    try:
        offset = (page - 1) * limit
        
        result = db.execute(text("""
            SELECT p.id, p.transaction_id, p.amount, p.type, p.status, p.date,
                   pm.name as payment_method_name
            FROM payments p
            LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
        """), {"limit": limit, "offset": offset})
        
        payments = []
        for payment in result.fetchall():
            payments.append({
                "id": payment.id,
                "transaction_id": payment.transaction_id,
                "amount": float(payment.amount),
                "type": payment.type,
                "status": payment.status,
                "date": payment.date.isoformat() if payment.date else None,
                "payment_method_name": payment.payment_method_name
            })
        
        return success_response("Payments retrieved successfully", payments)
        
    except Exception as e:
        logger.error(f"Error getting payments: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve payments")

# CREDIT ENDPOINTS
@credits_router.get("/")
def get_credits(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get credits with pagination"""
    try:
        offset = (page - 1) * limit
        
        result = db.execute(text("""
            SELECT c.id, c.user_id, c.amount, c.status, c.record_status,
                   u.username
            FROM credits c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
            LIMIT :limit OFFSET :offset
        """), {"limit": limit, "offset": offset})
        
        credits = []
        for credit in result.fetchall():
            credits.append({
                "id": credit.id,
                "user_id": credit.user_id,
                "username": credit.username,
                "amount": float(credit.amount),
                "status": credit.status,
                "record_status": credit.record_status
            })
        
        return success_response("Credits retrieved successfully", credits)
        
    except Exception as e:
        logger.error(f"Error getting credits: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve credits")
