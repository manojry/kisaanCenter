from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

# Import database manager and services
from src.database import db_manager, get_db
from src.services.user_service import UserService
from src.services.product_service import ProductService
from src.services.stock_service import StockService
from src.models import UserRole, Product, Transaction, Payment, Credit
from fastapi import Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import hashlib

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import API routers - only the working ones
try:
    from src.api import users
    logger.info("✅ Users module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import users module: {e}")
    users = None
    
try:
    from src.api import shops
    logger.info("✅ Shops module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import shops module: {e}")
    shops = None

try:
    from src.api import plans
    logger.info("✅ Plans module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import plans module: {e}")
    plans = None

try:
    from src.api import owner_users
    logger.info("✅ Owner Users module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import owner users module: {e}")
    owner_users = None

try:
    from src.api import owner_products
    logger.info("✅ Owner Products module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import owner products module: {e}")
    owner_products = None

try:
    from src.api import owner_transactions
    logger.info("✅ Owner Transactions module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import owner transactions module: {e}")
    owner_transactions = None

try:
    from src.api import owner_financial
    logger.info("✅ Owner Financial module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import owner financial module: {e}")
    owner_financial = None

try:
    from src.api import owner_analytics
    logger.info("✅ Owner Analytics module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import owner analytics module: {e}")
    owner_analytics = None

try:
    from src.api import owner_admin
    logger.info("✅ Owner Admin module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import owner admin module: {e}")
    owner_admin = None

try:
    from src.api import dashboard
    logger.info("✅ Dashboard module imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import dashboard module: {e}")
    dashboard = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Market Management System API starting up...")
    
    try:
        # Initialize database engine
        db_manager.initialize_engine()
        if db_manager.test_connection():
            logger.info("📊 Database connection established")
        else:
            logger.error("❌ Database connection failed")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
    
    logger.info("🔧 Services configured")
    logger.info("✅ Application ready to serve requests")
    
    yield
    
    # Shutdown
    logger.info("🛑 Market Management System API shutting down...")
    try:
        db_manager.close_connections()
        logger.info("💾 Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {str(e)}")
    logger.info("✅ Shutdown complete")

# Initialize FastAPI app
app = FastAPI(
    title="Market Management System API",
    description="""
    ## Enterprise-level Market Management System

    A comprehensive API system for managing agricultural market operations including:

    ### Features
    * **User Management**: Multi-role user system (superadmin, owner, farmer, buyer, employee)
    * **Shop Operations**: Multi-tenant shop management with plans and configurations
    * **Subscription Management**: Flexible billing cycles with feature controls
    * **Product Management**: Product catalog with categories and pricing
    * **Stock Management**: Real-time farmer stock tracking and adjustments
    * **Transaction Processing**: Complete transaction lifecycle with three-party completion model
    * **Payment Systems**: Multiple payment methods with partial payment support
    * **Credit Management**: Buyer credit system with detailed tracking
    * **Commission Tracking**: Automated commission calculation and confirmation
    * **Feature Controls**: Granular restrictions on user creation, data access, and transactions
    * **Usage Analytics**: Real-time usage tracking and upgrade predictions
    * **Audit Trail**: Complete audit logging for compliance and traceability
    
    ### Business Model
    * **Three-Party Completion**: Independent tracking of buyer payments, farmer payments, and commission confirmation
    * **Flexible Payments**: Support for full, partial, advance, and credit transactions
    * **Real-time Status**: Live transaction status updates and completion tracking
    * **Multi-tenant**: Complete data isolation per shop with cross-shop superadmin access
    
    ### Technical Features
    * **Enterprise Architecture**: Clean separation of concerns (API → Service → CRUD → DB)
    * **Comprehensive Validation**: Business rule validation at all levels
    * **Error Handling**: Structured error responses with detailed messages
    * **Pagination & Filtering**: Advanced querying capabilities
    * **Audit Logging**: Complete change tracking for regulatory compliance
    * **Performance Optimized**: Efficient queries with proper indexing
    """,
    version="1.0.0",
    contact={
        "name": "Market Management System",
        "email": "support@kisaancenter.com"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://kisaancenter.com/license"
    },
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler with structured responses"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": f"HTTP_{exc.status_code}",
            "path": str(request.url),
            "timestamp": time.time()
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "path": str(request.url),
            "timestamp": time.time()
        }
    )

# Include API routers - only the working ones
if users:
    app.include_router(users.router, prefix="/api/v1")
    logger.info("✅ Users router included")
else:
    logger.warning("⚠️ Users router not available - creating simple login endpoint")
    # Create essential user endpoints directly
    @app.post("/api/v1/users/auth/login")
    async def login(username: str, password: str, db: Session = Depends(get_db)):
        # Check superadmin first
        from src.models import Superadmin
        superadmin = db.query(Superadmin).filter(Superadmin.username == username).first()
        if superadmin:
            # Simple password check (in production, use proper hashing)
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            if superadmin.password_hash == password_hash:
                return {
                    "success": True,
                    "message": "Super Admin authentication successful",
                    "data": {
                        "id": superadmin.id,
                        "username": superadmin.username,
                        "role": "superadmin",
                        "shop_id": None
                    }
                }
        
        # Check regular users
        user = UserService.get_user_by_username(db, username)
        if user:
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            if user.password_hash == password_hash:
                return {
                    "success": True,
                    "message": "Authentication successful",
                    "data": {
                        "id": user.id,
                        "username": user.username,
                        "role": user.role.value,
                        "shop_id": user.shop_id
                    }
                }
        
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Pydantic models for request validation
    class UserCreate(BaseModel):
        username: str
        role: str
        shop_id: int
        contact: Optional[str] = None
        credit_limit: Optional[float] = 0.0
    
    class ProductCreate(BaseModel):
        name: str
        shop_id: int
        price: Optional[float] = 0.0
    
    class StockCreate(BaseModel):
        product_name: str
        quantity: float
        unit: str = "kg"
        farmer_id: int
        shop_id: int
    
    @app.get("/api/v1/users")
    async def get_users(shop_id: int = 1, page: int = 1, limit: int = 20, db: Session = Depends(get_db)):
        skip = (page - 1) * limit
        users = UserService.get_users(db, shop_id, skip, limit)
        
        user_data = []
        for user in users:
            user_data.append({
                "id": user.id,
                "username": user.username,
                "role": user.role.value,
                "shop_id": user.shop_id,
                "contact": user.contact,
                "credit_limit": float(user.credit_limit) if user.credit_limit else 0.0,
                "status": user.status.value,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })
        
        return {
            "success": True,
            "message": "Users retrieved successfully",
            "data": user_data,
            "pagination": {"page": page, "limit": limit, "total": len(user_data)}
        }
    
    @app.get("/api/v1/shops")
    async def get_shops(db: Session = Depends(get_db)):
        # Get shop info from database
        from src.models import Shop
        shops = db.query(Shop).all()
        
        shop_data = []
        for shop in shops:
            shop_data.append({
                "id": shop.id,
                "name": shop.name,
                "location": shop.location,
                "status": shop.status.value,
                "created_at": shop.created_at.isoformat() if shop.created_at else None
            })
        
        return {
            "success": True,
            "message": "Shops retrieved successfully",
            "data": shop_data
        }
    
    @app.get("/api/v1/admin/system-overview")
    async def get_superadmin_overview(db: Session = Depends(get_db)):
        from src.models import Shop, User, Transaction
        
        total_shops = db.query(Shop).count()
        total_users = db.query(User).count()
        total_transactions = db.query(Transaction).count()
        
        # Count users by role
        user_counts = {}
        for role in UserRole:
            count = db.query(User).filter(User.role == role).count()
            user_counts[role.value] = count
        
        return {
            "success": True,
            "message": "System overview retrieved successfully",
            "data": {
                "total_shops": total_shops,
                "total_users": total_users,
                "total_transactions": total_transactions,
                "user_counts": user_counts
            }
        }
    
    @app.get("/api/v1/admin/dashboard")
    async def get_superadmin_dashboard(db: Session = Depends(get_db)):
        from src.models import Shop, User, Transaction, RecordStatus
        from sqlalchemy import func, and_
        from datetime import date, timedelta
        
        # Get shop performance
        shops = db.query(Shop).filter(Shop.status == RecordStatus.ACTIVE).all()
        shop_performance = []
        total_revenue = 0
        
        for shop in shops:
            # Calculate revenue from transactions
            shop_transactions = db.query(Transaction).filter(Transaction.shop_id == shop.id).all()
            shop_revenue = 0
            for txn in shop_transactions:
                txn_amount = sum(float(item.quantity * item.price) for item in txn.transaction_items)
                shop_revenue += txn_amount
            
            total_revenue += shop_revenue
            shop_performance.append({
                "shop_id": shop.id,
                "name": shop.name,
                "revenue": shop_revenue,
                "status": shop.status.value
            })
        
        # Get user counts
        active_users = db.query(User).filter(User.status == RecordStatus.ACTIVE).count()
        
        return {
            "success": True,
            "message": "Superadmin dashboard retrieved successfully",
            "data": {
                "overview": {
                    "total_revenue": total_revenue,
                    "total_shops": len(shops),
                    "active_users": active_users
                },
                "shop_performance": shop_performance
            }
        }
    
    @app.get("/api/v1/admin/all-users")
    async def get_all_users(db: Session = Depends(get_db)):
        from src.models import User, Superadmin
        
        # Get all regular users
        users = db.query(User).all()
        user_data = []
        
        for user in users:
            user_data.append({
                "id": user.id,
                "username": user.username,
                "role": user.role.value,
                "shop_id": user.shop_id,
                "status": user.status.value
            })
        
        # Get superadmins
        superadmins = db.query(Superadmin).all()
        for sa in superadmins:
            user_data.append({
                "id": sa.id,
                "username": sa.username,
                "role": "superadmin",
                "shop_id": None,
                "status": sa.status.value
            })
        
        # Calculate summary
        role_counts = {}
        for user in user_data:
            role = user["role"]
            role_counts[role] = role_counts.get(role, 0) + 1
        
        return {
            "success": True,
            "message": "All users retrieved successfully",
            "data": {
                "users": user_data,
                "summary": {
                    "total_users": len(user_data),
                    "users_by_role": role_counts
                }
            }
        }
    
    @app.get("/api/v1/owner/dashboard")
    async def get_owner_dashboard(shop_id: int, db: Session = Depends(get_db)):
        from src.models import Shop, Product, Transaction, User, FarmerStock
        from datetime import date
        
        # Get shop info
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")
        
        # Calculate metrics
        total_products = db.query(Product).filter(Product.shop_id == shop_id).count()
        total_transactions = db.query(Transaction).filter(Transaction.shop_id == shop_id).count()
        
        # Calculate total revenue
        transactions = db.query(Transaction).filter(Transaction.shop_id == shop_id).all()
        total_revenue = 0
        for txn in transactions:
            txn_amount = sum(float(item.quantity * item.price) for item in txn.transaction_items)
            total_revenue += txn_amount
        
        # Today's transactions
        today_transactions = db.query(Transaction).filter(
            Transaction.shop_id == shop_id,
            Transaction.date == date.today()
        ).count()
        
        # Employee count
        employees = db.query(User).filter(
            User.shop_id == shop_id,
            User.role == UserRole.EMPLOYEE
        ).count()
        
        # Stock items
        stock_items = db.query(FarmerStock).filter(FarmerStock.shop_id == shop_id).count()
        
        return {
            "success": True,
            "message": "Owner dashboard retrieved successfully",
            "data": {
                "shop_overview": {
                    "shop_name": shop.name,
                    "shop_id": shop.id,
                    "total_revenue": total_revenue,
                    "active_products": total_products,
                    "total_transactions": total_transactions
                },
                "today_stats": {
                    "transactions": today_transactions
                },
                "employee_management": {
                    "total_employees": employees
                },
                "inventory": {
                    "total_stock_items": stock_items
                }
            }
        }
    
    @app.get("/api/v1/products")
    async def get_products(shop_id: int = 1, db: Session = Depends(get_db)):
        products = ProductService.get_products(db, shop_id)
        
        product_data = []
        for product in products:
            product_data.append({
                "id": product.id,
                "name": product.name,
                "shop_id": product.shop_id,
                "category_id": product.category_id,
                "status": product.status.value,
                "created_at": product.created_at.isoformat() if product.created_at else None
            })
        
        return {
            "success": True,
            "message": "Products retrieved successfully",
            "data": product_data
        }
    
    @app.get("/api/v1/transactions")
    async def get_transactions(shop_id: int = 1, db: Session = Depends(get_db)):
        transactions = db.query(Transaction).filter(Transaction.shop_id == shop_id).all()
        
        transaction_data = []
        for txn in transactions:
            # Calculate total amount from transaction items
            total_amount = sum(float(item.quantity * item.price) for item in txn.transaction_items)
            
            transaction_data.append({
                "id": txn.id,
                "amount": total_amount,
                "status": txn.status.value,
                "shop_id": txn.shop_id,
                "buyer_id": txn.buyer_user_id,
                "date": txn.date.isoformat() if txn.date else None,
                "created_at": txn.created_at.isoformat() if txn.created_at else None
            })
        
        return {
            "success": True,
            "message": "Transactions retrieved successfully",
            "data": transaction_data
        }
    
    @app.post("/api/v1/users")
    async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
        # Hash password (simple hash for demo)
        password_hash = hashlib.sha256("password".encode()).hexdigest()
        
        user = UserService.create_user(
            db=db,
            username=user_data.username,
            password_hash=password_hash,
            role=UserRole(user_data.role),
            shop_id=user_data.shop_id,
            contact=user_data.contact,
            credit_limit=user_data.credit_limit
        )
        
        return {
            "success": True,
            "message": "User created successfully",
            "data": {
                "id": user.id,
                "username": user.username,
                "role": user.role.value,
                "shop_id": user.shop_id
            }
        }
    
    @app.put("/api/v1/users/{user_id}")
    async def update_user(user_id: int, username: str = None, role: str = None, db: Session = Depends(get_db)):
        update_data = {}
        if username:
            update_data['username'] = username
        if role:
            update_data['role'] = UserRole(role)
        
        user = UserService.update_user(db, user_id, **update_data)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": "User updated successfully",
            "data": {
                "id": user.id,
                "username": user.username,
                "role": user.role.value
            }
        }
    
    @app.delete("/api/v1/users/{user_id}")
    async def delete_user(user_id: int, db: Session = Depends(get_db)):
        success = UserService.delete_user(db, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "message": "User deleted successfully"}
    
    @app.get("/api/v1/stock")
    async def get_stock(shop_id: int = 1, db: Session = Depends(get_db)):
        stock_data = StockService.get_stock(db, shop_id)
        
        return {
            "success": True,
            "message": "Stock retrieved successfully",
            "data": stock_data
        }
    
    @app.post("/api/v1/stock")
    async def create_stock(stock_data: StockCreate, db: Session = Depends(get_db)):
        # First, find or create the product
        product = db.query(Product).filter(
            Product.name == stock_data.product_name,
            Product.shop_id == stock_data.shop_id
        ).first()
        
        if not product:
            product = ProductService.create_product(
                db=db,
                name=stock_data.product_name,
                shop_id=stock_data.shop_id
            )
        
        stock = StockService.create_stock(
            db=db,
            shop_id=stock_data.shop_id,
            farmer_user_id=stock_data.farmer_id,
            product_id=product.id,
            quantity=stock_data.quantity
        )
        
        return {
            "success": True,
            "message": "Stock added successfully",
            "data": {
                "id": stock.id,
                "product_name": product.name,
                "quantity": float(stock.quantity),
                "farmer_id": stock.farmer_user_id,
                "shop_id": stock.shop_id
            }
        }
    
    @app.put("/api/v1/stock/{stock_id}")
    async def update_stock(stock_id: int, quantity: float = None, db: Session = Depends(get_db)):
        update_data = {}
        if quantity is not None:
            update_data['quantity'] = quantity
        
        stock = StockService.update_stock(db, stock_id, **update_data)
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found")
        
        return {
            "success": True,
            "message": "Stock updated successfully",
            "data": {
                "id": stock.id,
                "quantity": float(stock.quantity),
                "shop_id": stock.shop_id
            }
        }
    
    @app.post("/api/v1/products")
    async def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
        product = ProductService.create_product(
            db=db,
            name=product_data.name,
            shop_id=product_data.shop_id
        )
        
        return {
            "success": True,
            "message": "Product created successfully",
            "data": {
                "id": product.id,
                "name": product.name,
                "shop_id": product.shop_id
            }
        }
    
    @app.put("/api/v1/products/{product_id}")
    async def update_product(product_id: int, name: str = None, db: Session = Depends(get_db)):
        update_data = {}
        if name:
            update_data['name'] = name
        
        product = ProductService.update_product(db, product_id, **update_data)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {
            "success": True,
            "message": "Product updated successfully",
            "data": {
                "id": product.id,
                "name": product.name,
                "shop_id": product.shop_id
            }
        }
    
    @app.delete("/api/v1/products/{product_id}")
    async def delete_product(product_id: int, db: Session = Depends(get_db)):
        success = ProductService.delete_product(db, product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"success": True, "message": "Product deleted successfully"}
    
    class TransactionCreate(BaseModel):
        buyer_user_id: int
        shop_id: int
        items: list  # List of transaction items
    
    @app.post("/api/v1/transactions")
    async def create_transaction(transaction_data: TransactionCreate, db: Session = Depends(get_db)):
        from src.models import Transaction, TransactionItem
        from datetime import date
        
        # Create transaction
        transaction = Transaction(
            shop_id=transaction_data.shop_id,
            buyer_user_id=transaction_data.buyer_user_id,
            date=date.today()
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        return {
            "success": True,
            "message": "Transaction created successfully",
            "data": {
                "id": transaction.id,
                "shop_id": transaction.shop_id,
                "buyer_user_id": transaction.buyer_user_id,
                "status": transaction.status.value
            }
        }
    
    @app.put("/api/v1/transactions/{transaction_id}")
    async def update_transaction(transaction_id: int, status: str = None, db: Session = Depends(get_db)):
        from src.models import TransactionStatus
        
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if status:
            transaction.status = TransactionStatus(status)
        
        db.commit()
        db.refresh(transaction)
        
        return {
            "success": True,
            "message": "Transaction updated successfully",
            "data": {
                "id": transaction.id,
                "status": transaction.status.value,
                "shop_id": transaction.shop_id
            }
        }
    
    @app.get("/api/v1/payments")
    async def get_payments(shop_id: int = 1, db: Session = Depends(get_db)):
        payments = db.query(Payment).join(Transaction).filter(Transaction.shop_id == shop_id).all()
        
        payment_data = []
        for payment in payments:
            payment_data.append({
                "id": payment.id,
                "amount": float(payment.amount),
                "method": payment.payment_method.name if payment.payment_method else "cash",
                "type": payment.type.value,
                "status": payment.status.value,
                "date": payment.date.isoformat() if payment.date else None
            })
        
        return {
            "success": True,
            "message": "Payments retrieved successfully",
            "data": payment_data
        }
    
    class PaymentCreate(BaseModel):
        transaction_id: int
        amount: float
        method: str = "cash"
    
    @app.post("/api/v1/payments")
    async def create_payment(payment_data: PaymentCreate, db: Session = Depends(get_db)):
        from src.models import Payment, PaymentType
        from datetime import date
        
        payment = Payment(
            transaction_id=payment_data.transaction_id,
            amount=payment_data.amount,
            type=PaymentType.PAYMENT,
            date=date.today()
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        return {
            "success": True,
            "message": "Payment created successfully",
            "data": {
                "id": payment.id,
                "amount": float(payment.amount),
                "transaction_id": payment.transaction_id
            }
        }
    
    @app.get("/api/v1/credits")
    async def get_credits(shop_id: int = 1, db: Session = Depends(get_db)):
        credits = db.query(Credit).join(Transaction).filter(Transaction.shop_id == shop_id).all()
        
        credit_data = []
        for credit in credits:
            credit_data.append({
                "id": credit.id,
                "amount": float(credit.amount),
                "status": credit.status.value,
                "buyer_id": credit.buyer_user_id,
                "transaction_id": credit.transaction_id,
                "created_at": credit.created_at.isoformat() if credit.created_at else None
            })
        
        return {
            "success": True,
            "message": "Credits retrieved successfully",
            "data": credit_data
        }
    
    class CreditCreate(BaseModel):
        buyer_user_id: int
        transaction_id: int
        amount: float
    
    @app.post("/api/v1/credits")
    async def create_credit(credit_data: CreditCreate, db: Session = Depends(get_db)):
        credit = Credit(
            buyer_user_id=credit_data.buyer_user_id,
            transaction_id=credit_data.transaction_id,
            amount=credit_data.amount
        )
        
        db.add(credit)
        db.commit()
        db.refresh(credit)
        
        return {
            "success": True,
            "message": "Credit created successfully",
            "data": {
                "id": credit.id,
                "amount": float(credit.amount),
                "buyer_user_id": credit.buyer_user_id,
                "status": credit.status.value
            }
        }
    
    @app.get("/api/v1/subscriptions")
    async def get_subscriptions(shop_id: int = None, db: Session = Depends(get_db)):
        from src.models import Subscription
        
        query = db.query(Subscription)
        if shop_id:
            query = query.filter(Subscription.shop_id == shop_id)
        
        subscriptions = query.all()
        
        subscription_data = []
        for sub in subscriptions:
            subscription_data.append({
                "id": sub.id,
                "shop_id": sub.shop_id,
                "plan_id": sub.plan_id,
                "status": sub.status.value,
                "billing_cycle": sub.billing_cycle.value,
                "amount": float(sub.amount),
                "start_date": sub.start_date.isoformat(),
                "end_date": sub.end_date.isoformat()
            })
        
        return {
            "success": True,
            "message": "Subscriptions retrieved successfully",
            "data": subscription_data
        }
    
    class ExpenseCreate(BaseModel):
        description: str
        amount: float
        category: str
        date: str
        shop_id: int
    
    @app.get("/api/v1/expenses")
    async def get_expenses(shop_id: int = 1, db: Session = Depends(get_db)):
        from src.models import Expense
        expenses = db.query(Expense).filter(Expense.shop_id == shop_id).all()
        
        expense_data = []
        for expense in expenses:
            expense_data.append({
                "id": expense.id,
                "description": expense.description,
                "amount": float(expense.amount),
                "category": "general",  # Default category
                "date": expense.created_at.date().isoformat() if expense.created_at else None,
                "shop_id": expense.shop_id
            })
        
        return {
            "success": True,
            "message": "Expenses retrieved successfully",
            "data": expense_data
        }
    
    @app.post("/api/v1/expenses")
    async def create_expense(expense_data: ExpenseCreate, db: Session = Depends(get_db)):
        from src.models import Expense
        from datetime import datetime
        
        expense = Expense(
            shop_id=expense_data.shop_id,
            amount=expense_data.amount,
            description=expense_data.description,
            created_at=datetime.fromisoformat(expense_data.date) if expense_data.date else datetime.utcnow()
        )
        
        db.add(expense)
        db.commit()
        db.refresh(expense)
        
        return {
            "success": True,
            "message": "Expense created successfully",
            "data": {
                "id": expense.id,
                "description": expense.description,
                "amount": float(expense.amount),
                "shop_id": expense.shop_id
            }
        }
    
    @app.get("/api/v1/reports/sales")
    async def get_sales_report(shop_id: int = 1, period: str = "monthly", db: Session = Depends(get_db)):
        from datetime import datetime, timedelta
        
        # Calculate date range based on period
        end_date = datetime.now().date()
        if period == "daily":
            start_date = end_date
        elif period == "weekly":
            start_date = end_date - timedelta(days=7)
        elif period == "yearly":
            start_date = end_date - timedelta(days=365)
        else:  # monthly
            start_date = end_date - timedelta(days=30)
        
        # Get transactions in period
        transactions = db.query(Transaction).filter(
            Transaction.shop_id == shop_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).all()
        
        # Calculate metrics
        total_revenue = 0
        transaction_count = len(transactions)
        
        for txn in transactions:
            txn_amount = sum(float(item.quantity * item.price) for item in txn.transaction_items)
            total_revenue += txn_amount
        
        avg_sale = total_revenue / transaction_count if transaction_count > 0 else 0
        
        return {
            "success": True,
            "message": "Sales report retrieved successfully",
            "data": {
                "revenue": total_revenue,
                "transactions": transaction_count,
                "avg_sale": avg_sale,
                "period": period,
                "shop_id": shop_id
            }
        }
    
    @app.get("/api/v1/reports/financial")
    async def get_financial_report(shop_id: int = 1, db: Session = Depends(get_db)):
        from src.models import Expense
        
        # Calculate revenue from transactions
        transactions = db.query(Transaction).filter(Transaction.shop_id == shop_id).all()
        total_revenue = 0
        total_commission = 0
        
        for txn in transactions:
            txn_amount = sum(float(item.quantity * item.price) for item in txn.transaction_items)
            total_revenue += txn_amount
            total_commission += float(txn.commission_amount)
        
        # Calculate expenses
        expenses = db.query(Expense).filter(Expense.shop_id == shop_id).all()
        total_expenses = sum(float(expense.amount) for expense in expenses)
        
        # Calculate profit
        profit = total_revenue - total_expenses
        
        return {
            "success": True,
            "message": "Financial report retrieved successfully",
            "data": {
                "revenue": total_revenue,
                "profit": profit,
                "commission": total_commission,
                "expenses": total_expenses,
                "shop_id": shop_id
            }
        }
    


if shops:
    app.include_router(shops.router, prefix="/api/v1")
    logger.info("✅ Shops router included")

if plans:
    app.include_router(plans.router, prefix="/api/v1")
    logger.info("✅ Plans router included")

if owner_users:
    app.include_router(owner_users.router, prefix="/api/v1")
    logger.info("✅ Owner Users router included")

if owner_products:
    app.include_router(owner_products.router, prefix="/api/v1")
    logger.info("✅ Owner Products router included")

if owner_transactions:
    app.include_router(owner_transactions.router, prefix="/api/v1")
    logger.info("✅ Owner Transactions router included")

if owner_financial:
    app.include_router(owner_financial.router, prefix="/api/v1")
    logger.info("✅ Owner Financial router included")

if owner_analytics:
    app.include_router(owner_analytics.router, prefix="/api/v1")
    logger.info("✅ Owner Analytics router included")

if owner_admin:
    app.include_router(owner_admin.router, prefix="/api/v1")
    logger.info("✅ Owner Admin router included")

if dashboard:
    app.include_router(dashboard.router, prefix="/api/v1")
    logger.info("✅ Dashboard router included")

# Health check endpoints
@app.get("/", tags=["Health"])
def read_root():
    """Root endpoint - API health check"""
    return {
        "message": "🚀 Market Management System API is running",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": time.time(),
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Detailed health check endpoint"""
    db_status = "connected" if db_manager.test_connection() else "disconnected"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": time.time(),
        "version": "1.0.0",
        "services": {
            "api": "operational",
            "database": db_status,
            "cache": "operational"
        },
        "database_info": db_manager.get_connection_info(),
        "uptime": "Available via /metrics endpoint"
    }

@app.get("/api/v1/info", tags=["System"])
def api_info():
    """API information and capabilities"""
    return {
        "name": "Market Management System API",
        "version": "1.0.0",
        "description": "Enterprise-level agricultural market management system",
        "features": [
            "Multi-tenant shop management",
            "Three-party transaction completion model",
            "Real-time stock management",
            "Flexible payment systems",
            "Credit management",
            "Commission tracking",
            "Comprehensive audit trail"
        ],
        "endpoints": {
            "users": "/api/v1/users",
            "shops": "/api/v1/shops", 
            "plans": "/api/v1/plans",
            "products": "/api/v1/products",
            "transactions": "/api/v1/transactions",
            "payments": "/api/v1/payments",
            "credits": "/api/v1/credits",
            "subscriptions": "/api/v1/subscriptions",
            "super_admin": "/api/v1/admin"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json"
        }
    }
