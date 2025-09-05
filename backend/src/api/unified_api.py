"""
Unified API Endpoints - Single Source of Truth
Consolidates all scattered API endpoints into one organized file
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, status
from fastapi import Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Dict, Any
from datetime import datetime
import hashlib
import logging
import psycopg2
import json
import base64

# Database and schemas
from ..database import get_db
from ..schemas.user_schemas import UserCreate, UserRead
from ..schemas import APIResponse, ProductCreate, ShopCreate

# Services
from ..services.user_service import UserService
from ..services.product_service import ProductService
from ..services.shop_service import ShopService
from ..features.auth.services.auth_service import AuthService

logger = logging.getLogger(__name__)

# =============================================================================
# UNIFIED API ROUTERS - SINGLE SOURCE OF TRUTH
# =============================================================================

# Create unified routers
auth_router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/api/v1/users", tags=["Users"])
shops_router = APIRouter(prefix="/api/v1/shops", tags=["Shops"])  
products_router = APIRouter(prefix="/api/v1/products", tags=["Products"])
transactions_router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])
owner_admin_router = APIRouter(prefix="/api/v1/owner-admin", tags=["Owner Admin"])
dashboard_router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

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

def create_access_token(user_id: int, username: str, role: str, shop_id: int = None) -> str:
    """Create simple access token"""
    from datetime import datetime, timedelta
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "shop_id": shop_id,
        "exp": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "iat": datetime.utcnow().isoformat()
    }
    return base64.b64encode(json.dumps(payload).encode()).decode()

# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

@auth_router.post("/login", response_model=APIResponse, summary="User Login")
def login_user(
    payload: dict = Body(..., examples={
        "default": {
            "summary": "Owner login",
            "value": {"username": "reddy", "password": "reddy123"}
        }
    }),
    db: Session = Depends(get_db)
):
    """Authenticate user credentials and get access token"""
    username = payload.get("username")
    password = payload.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
        
    try:
        password_hash = hash_password(password)
        logger.info(f"Login attempt: username='{username}'")

        result = db.execute(text("""
            SELECT id, username, role, shop_id FROM users 
            WHERE username = :username AND password_hash = :password_hash AND record_status = 'active'
        """), {"username": username, "password_hash": password_hash})

        user = result.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

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
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

# =============================================================================
# USER ENDPOINTS
# =============================================================================

@users_router.get("/{user_id}", summary="Get User by ID")
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

@users_router.get("/", summary="Get Users with Pagination")
def get_users(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    shop_id: Optional[int] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get users with pagination and filtering"""
    try:
        logger.info(f"[GET /api/v1/users] Query params: page={page}, limit={limit}, shop_id={shop_id}, role={role}")
        offset = (page - 1) * limit
        
        where_conditions = []
        params = {"limit": limit, "offset": offset}
        
        if shop_id:
            where_conditions.append("shop_id = :shop_id")
            params["shop_id"] = shop_id
            
        if role:
            where_conditions.append("role = :role")
            params["role"] = role
            
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        result = db.execute(text(f"""
            SELECT id, username, role, shop_id, contact, credit_limit, record_status, created_at
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
                "created_at": user.created_at.isoformat() if user.created_at else None
            })
        
        # Get total count
        count_result = db.execute(text(f"""
            SELECT COUNT(*) as total FROM users {where_clause}
        """), {k: v for k, v in params.items() if k not in ['limit', 'offset']})
        total = count_result.fetchone().total
        
        return success_response(f"Found {len(users)} users", {
            "users": users,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        })
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users")

# =============================================================================
# SHOP ENDPOINTS  
# =============================================================================

@shops_router.get("/{shop_id}/dashboard", summary="Shop Dashboard (Alternative Endpoint)")
def get_shop_dashboard_alt(shop_id: int, db: Session = Depends(get_db)):
    """Get comprehensive shop dashboard data - alternative endpoint for backward compatibility"""
    return get_shop_dashboard(shop_id, db)

@shops_router.get("/{shop_id}", summary="Get Shop by ID")
def get_shop(shop_id: int, db: Session = Depends(get_db)):
    """Get shop by ID"""
    try:
        result = db.execute(text("""
            SELECT id, name, location, commission_rate, record_status, created_at
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
            "record_status": shop.record_status,
            "created_at": shop.created_at.isoformat() if shop.created_at else None
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting shop: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve shop")

@shops_router.get("/", summary="Get Shops with Pagination") 
def get_shops(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get shops with pagination"""
    try:
        offset = (page - 1) * limit
        
        result = db.execute(text("""
            SELECT id, name, location, commission_rate, record_status, created_at
            FROM shops WHERE record_status = 'active'
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
                "record_status": shop.record_status,
                "created_at": shop.created_at.isoformat() if shop.created_at else None
            })
        
        # Get total count
        count_result = db.execute(text("SELECT COUNT(*) as total FROM shops WHERE record_status = 'active'"))
        total = count_result.fetchone().total
        
        return success_response(f"Found {len(shops)} shops", {
            "shops": shops,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        })
    except Exception as e:
        logger.error(f"Error getting shops: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve shops")

# =============================================================================
# PRODUCT ENDPOINTS
# =============================================================================

@products_router.get("/{product_id}", summary="Get Product by ID")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product by ID"""
    try:
        result = db.execute(text("""
            SELECT id, name, description, category_id, price, shop_id, record_status, created_at
            FROM products WHERE id = :product_id
        """), {"product_id": product_id})
        
        product = result.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return success_response("Product found", {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "category_id": product.category_id,
            "price": float(product.price),
            "shop_id": product.shop_id,
            "record_status": product.record_status,
            "created_at": product.created_at.isoformat() if product.created_at else None
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting product: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve product")

@products_router.get("/", summary="Get Products with Pagination")
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    shop_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get products with pagination and filtering"""
    try:
        offset = (page - 1) * limit
        
        where_conditions = ["record_status = 'active'"]
        params = {"limit": limit, "offset": offset}
        
        if shop_id:
            where_conditions.append("shop_id = :shop_id")
            params["shop_id"] = shop_id
            
        if category_id:
            where_conditions.append("category_id = :category_id")
            params["category_id"] = category_id
            
        where_clause = "WHERE " + " AND ".join(where_conditions)
        
        result = db.execute(text(f"""
            SELECT id, name, description, category_id, price, shop_id, record_status, created_at
            FROM products {where_clause}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """), params)
        
        products = []
        for product in result.fetchall():
            products.append({
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "category_id": product.category_id,
                "price": float(product.price),
                "shop_id": product.shop_id,
                "record_status": product.record_status,
                "created_at": product.created_at.isoformat() if product.created_at else None
            })
        
        # Get total count
        count_result = db.execute(text(f"""
            SELECT COUNT(*) as total FROM products {where_clause}
        """), {k: v for k, v in params.items() if k not in ['limit', 'offset']})
        total = count_result.fetchone().total
        
        return success_response(f"Found {len(products)} products", {
            "products": products,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        })
    except Exception as e:
        logger.error(f"Error getting products: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve products")

# =============================================================================
# OWNER ADMIN ENDPOINTS
# =============================================================================

@owner_admin_router.post("/shops/{shop_id}/users", response_model=APIResponse, summary="Create User in Shop")
def create_user_in_shop(
    shop_id: int,
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Owner creates users in their shop"""
    try:
        # Use the UserService to create the user
        result = UserService.create_user(db, user_data, created_by_id=1)  # TODO: Get from auth
        
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user in shop {shop_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")

@owner_admin_router.post("/shops/{shop_id}/products", response_model=APIResponse, summary="Create Product in Shop")  
def create_product_in_shop(
    shop_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    """Owner creates products in their shop"""
    try:
        # Ensure product is assigned to the correct shop
        product_data.shop_id = shop_id
        
        # Use ProductService to create the product
        result = ProductService.create_product(db, product_data)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product in shop {shop_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create product")

@owner_admin_router.get("/shops/{shop_id}/users", response_model=APIResponse, summary="Get Shop Users")
def get_shop_users(
    shop_id: int,
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all users for a shop"""
    try:
        where_conditions = ["shop_id = :shop_id", "record_status = 'active'"]
        params = {"shop_id": shop_id}
        
        if role:
            where_conditions.append("role = :role")
            params["role"] = role
            
        where_clause = "WHERE " + " AND ".join(where_conditions)
        
        result = db.execute(text(f"""
            SELECT id, username, role, contact, credit_limit, record_status, created_at
            FROM users {where_clause}
            ORDER BY created_at DESC
        """), params)
        
        users = []
        for user in result.fetchall():
            users.append({
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "contact": user.contact,
                "credit_limit": float(user.credit_limit),
                "record_status": user.record_status,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })
        
        return success_response(f"Found {len(users)} users for shop {shop_id}", users)
    except Exception as e:
        logger.error(f"Error getting users for shop {shop_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve shop users")

@owner_admin_router.get("/shops/{shop_id}/products", response_model=APIResponse, summary="Get Shop Products")
def get_shop_products(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get all products for a shop"""
    try:
        result = db.execute(text("""
            SELECT id, name, description, category_id, price, record_status, created_at
            FROM products 
            WHERE shop_id = :shop_id AND record_status = 'active'
            ORDER BY created_at DESC
        """), {"shop_id": shop_id})
        
        products = []
        for product in result.fetchall():
            products.append({
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "category_id": product.category_id,
                "price": float(product.price),
                "record_status": product.record_status,
                "created_at": product.created_at.isoformat() if product.created_at else None
            })
        
        return success_response(f"Found {len(products)} products for shop {shop_id}", {
            "success": True,
            "data": {
                "products": products
            }
        })
    except Exception as e:
        logger.error(f"Error getting products for shop {shop_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve shop products")

@owner_admin_router.get("/shops/{shop_id}/analytics", response_model=APIResponse, summary="Get Shop Analytics")
def get_shop_analytics(
    shop_id: int,
    days: int = Query(30, description="Number of days for analytics"),
    db: Session = Depends(get_db)
):
    """Get comprehensive shop analytics"""
    try:
        # Get transaction analytics (using Python to calculate date)
        from datetime import datetime, timedelta
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        analytics_result = db.execute(text("""
            SELECT 
                COUNT(t.id) as total_transactions,
                COALESCE(SUM(CASE WHEN ti.quantity IS NOT NULL AND ti.price IS NOT NULL 
                    THEN ti.quantity * ti.price ELSE 0 END), 0) as total_revenue,
                COALESCE(AVG(CASE WHEN ti.quantity IS NOT NULL AND ti.price IS NOT NULL 
                    THEN ti.quantity * ti.price ELSE NULL END), 0) as avg_transaction_value,
                COUNT(DISTINCT fs.farmer_id) as unique_farmers,
                COUNT(DISTINCT t.buyer_id) as unique_buyers,
                COUNT(DISTINCT ti.product_id) as unique_products
            FROM transactions t
            LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
            LEFT JOIN farmer_stock fs ON ti.farmer_stock_id = fs.id
            WHERE t.shop_id = :shop_id 
            AND t.created_at >= :start_date
        """), {"shop_id": shop_id, "start_date": start_date})
        
        analytics = analytics_result.fetchone()
        
        # Get top products (using the same date calculation)
        top_products_result = db.execute(text("""
            SELECT p.name, COUNT(t.id) as transaction_count, 
                   COALESCE(SUM(CASE WHEN ti.quantity IS NOT NULL AND ti.price IS NOT NULL 
                        THEN ti.quantity * ti.price ELSE 0 END), 0) as total_sales
            FROM transactions t
            LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
            LEFT JOIN products p ON ti.product_id = p.id
            WHERE t.shop_id = :shop_id
            AND t.created_at >= :start_date
            AND p.name IS NOT NULL
            GROUP BY p.id, p.name
            ORDER BY total_sales DESC
            LIMIT 5
        """), {"shop_id": shop_id, "start_date": start_date})
        
        top_products = []
        for product in top_products_result.fetchall():
            top_products.append({
                "name": product.name,
                "transaction_count": product.transaction_count,
                "total_sales": float(product.total_sales)
            })
        
        analytics_data = {
            "period_days": days,
            "transaction_summary": {
                "total_transactions": analytics.total_transactions,
                "total_revenue": float(analytics.total_revenue),
                "average_transaction_value": float(analytics.avg_transaction_value),
                "unique_farmers": analytics.unique_farmers,
                "unique_buyers": analytics.unique_buyers,
                "unique_products": analytics.unique_products
            },
            "top_products": top_products,
            "performance_metrics": {
                "daily_avg_transactions": analytics.total_transactions / days,
                "daily_avg_revenue": float(analytics.total_revenue) / days,
                "commission_earned": float(analytics.total_revenue) * 0.05  # 5% commission
            }
        }
        
        return success_response("Analytics data retrieved successfully", analytics_data)
    except Exception as e:
        logger.error(f"Error getting analytics for shop {shop_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve shop analytics")

# =============================================================================
# TRANSACTION ENDPOINTS  
# =============================================================================

@transactions_router.get("/", summary="Get Transactions")
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    shop_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get transactions with pagination"""
    try:
        offset = (page - 1) * limit
        
        where_conditions = []
        params = {"limit": limit, "offset": offset}
        
        if shop_id:
            where_conditions.append("shop_id = :shop_id")
            params["shop_id"] = shop_id
            
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        result = db.execute(text(f"""
            SELECT t.id, fs.farmer_id, t.buyer_id, ti.product_id, ti.quantity, ti.price, 
                   (ti.quantity * ti.price) as total, t.status, t.shop_id, t.created_at, p.name as product_name
            FROM transactions t
            LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
            LEFT JOIN farmer_stock fs ON ti.farmer_stock_id = fs.id
            LEFT JOIN products p ON ti.product_id = p.id
            {where_clause}
            ORDER BY t.created_at DESC
            LIMIT :limit OFFSET :offset
        """), params)
        
        transactions = []
        for txn in result.fetchall():
            transactions.append({
                "id": txn.id,
                "farmer_id": txn.farmer_id if txn.farmer_id else None,
                "buyer_id": txn.buyer_id,
                "product_id": txn.product_id,
                "product_name": txn.product_name if txn.product_name else "Unknown",
                "quantity": float(txn.quantity) if txn.quantity else 0,
                "price_per_unit": float(txn.price) if txn.price else 0,
                "total_amount": float(txn.total) if txn.total else 0,
                "status": txn.status,
                "shop_id": txn.shop_id,
                "created_at": txn.created_at.isoformat() if txn.created_at else None
            })
        
        return success_response(f"Found {len(transactions)} transactions", {
            "transactions": transactions,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(transactions)  # TODO: Get actual count
            }
        })
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve transactions")

# =============================================================================
# DASHBOARD ENDPOINTS
# =============================================================================

@dashboard_router.get("/shops/{shop_id}", summary="Shop Dashboard")
def get_shop_dashboard(shop_id: int, db: Session = Depends(get_db)):
    """Get comprehensive shop dashboard data"""
    try:
        # Get shop info
        shop_result = db.execute(text("""
            SELECT id, name, location, commission_rate FROM shops WHERE id = :shop_id
        """), {"shop_id": shop_id})
        shop = shop_result.fetchone()
        
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")
        
        # Get user counts
        users_result = db.execute(text("""
            SELECT role, COUNT(*) as count FROM users 
            WHERE shop_id = :shop_id AND record_status = 'active'
            GROUP BY role
        """), {"shop_id": shop_id})
        
        user_counts = {}
        for row in users_result.fetchall():
            user_counts[row.role] = row.count
            
        # Get product count
        products_result = db.execute(text("""
            SELECT COUNT(*) as count FROM products 
            WHERE shop_id = :shop_id AND record_status = 'active'
        """), {"shop_id": shop_id})
        product_count = products_result.fetchone().count
        
        # Get transaction count and financial data (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        transactions_result = db.execute(text("""
            SELECT 
                COUNT(t.id) as total_transactions,
                COALESCE(SUM(CASE WHEN ti.quantity IS NOT NULL AND ti.price IS NOT NULL 
                    THEN ti.quantity * ti.price ELSE 0 END), 0) as total_sales,
                COALESCE(SUM(CASE WHEN ti.quantity IS NOT NULL AND ti.price IS NOT NULL AND t.commission_rate IS NOT NULL 
                    THEN (ti.quantity * ti.price) * t.commission_rate / 100 ELSE 0 END), 0) as total_commission
            FROM transactions t
            LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
            WHERE t.shop_id = :shop_id AND t.created_at >= :thirty_days_ago
        """), {"shop_id": shop_id, "thirty_days_ago": thirty_days_ago})
        
        financial_data = transactions_result.fetchone()
        
        # Build comprehensive dashboard response
        dashboard_data = {
            "shop_info": {
                "id": shop.id,
                "name": shop.name,
                "location": shop.location,
                "commission_rate": float(shop.commission_rate)
            },
            "overview": {
                "total_users": sum(user_counts.values()),
                "total_products": product_count,
                "total_transactions": financial_data.total_transactions
            },
            "users_by_role": user_counts,
            "financial_summary": {
                "total_sales_30d": float(financial_data.total_sales),
                "total_commission_30d": float(financial_data.total_commission),
                "currency": "INR"
            },
            "quick_actions": [
                {
                    "title": "Add New User",
                    "description": "Create farmers, buyers, or employees",
                    "endpoint": f"/api/v1/owner-admin/shops/{shop_id}/users"
                },
                {
                    "title": "Manage Products", 
                    "description": "Add and configure shop products",
                    "endpoint": f"/api/v1/owner-admin/shops/{shop_id}/products"
                },
                {
                    "title": "View Transactions",
                    "description": "Monitor daily transactions",
                    "endpoint": "/api/v1/transactions"
                },
                {
                    "title": "Analytics",
                    "description": "Business performance insights", 
                    "endpoint": f"/api/v1/owner-admin/shops/{shop_id}/analytics"
                }
            ]
        }
        
        return success_response("Dashboard data retrieved successfully", dashboard_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting shop dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard data")

# =============================================================================
# EXPORT ALL ROUTERS
# =============================================================================

# List of all routers to be imported by main.py
ALL_ROUTERS = [
    auth_router,
    users_router, 
    shops_router,
    products_router,
    transactions_router,
    owner_admin_router,
    dashboard_router
]
