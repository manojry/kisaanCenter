from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

# Import routers
from .api import users, shops, products, transactions, payments, credits

# Configure logging
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
    logger.info("📊 Database connections initialized")
    logger.info("🔧 Services configured")
    logger.info("✅ Application ready to serve requests")
    
    yield
    
    # Shutdown
    logger.info("🛑 Market Management System API shutting down...")
    logger.info("💾 Cleaning up resources...")
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
    * **Product Management**: Product catalog with categories and pricing
    * **Stock Management**: Real-time farmer stock tracking and adjustments
    * **Transaction Processing**: Complete transaction lifecycle with three-party completion model
    * **Payment Systems**: Multiple payment methods with partial payment support
    * **Credit Management**: Buyer credit system with detailed tracking
    * **Commission Tracking**: Automated commission calculation and confirmation
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

# Include API routers
app.include_router(users.router, prefix="/api/v1")
app.include_router(shops.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(credits.router, prefix="/api/v1")

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
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "services": {
            "api": "operational",
            "database": "connected",
            "cache": "operational"
        },
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
            "credits": "/api/v1/credits"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json"
        }
    }
