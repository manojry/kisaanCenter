from fastapi import FastAPI, Request, HTTPException, APIRouter
from src.models import Base  # Only import Base to register models for SQLAlchemy
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from src.core.middleware import rate_limit_middleware, token_validation_middleware
from src.core.config import settings
import logging
import time

# Import database manager
from src.database import db_manager

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

# Create main API router
main_router = APIRouter()

# Import routers
from src.api.simple_endpoints import users_router, shops_router, products_router, payments_router, credits_router
from src.api.transaction_endpoints import router as transactions_router

# Create the FastAPI app
app = FastAPI(
    title="Market Management System API",
    description="A comprehensive API system for managing agricultural market operations including various features for multi-tenant shop management, real-time stock tracking, and secure transactions.",
    lifespan=lifespan,
    version="1.0.0",
    contact={
        "name": "Market Management System",
        "email": "support@kisaancenter.com"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://kisaancenter.com/license"
    }
)

# Include all routers in the main router
main_router.include_router(users_router, prefix="/api/v1/users")
main_router.include_router(shops_router, prefix="/api/v1/shops")
main_router.include_router(products_router, prefix="/api/v1/products")
main_router.include_router(payments_router, prefix="/api/v1/payments")
main_router.include_router(credits_router, prefix="/api/v1/credits")
main_router.include_router(transactions_router, prefix="/api/v1")

# Include the main router in the app
app.include_router(main_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Skip security middleware for development
# app.middleware("http")(rate_limit_middleware)
# app.middleware("http")(token_validation_middleware)

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

# Log router inclusion
logger.info("✅ All API routers included successfully")

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
            "products": "/api/v1/products",
            "transactions": "/api/v1/transactions",
            "payments": "/api/v1/payments",
            "credits": "/api/v1/credits",
            "subscriptions": "/api/v1/subscriptions",
            "transactions": "/api/v1/transactions",
            "stock": "/api/v1/farmer-stock",
            "super_admin": "/api/v1/admin"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json"
        }
    }
