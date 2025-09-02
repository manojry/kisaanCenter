from fastapi import FastAPI, Request, HTTPException, APIRouter
from .models import Base  # Only import Base to register models for SQLAlchemy
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .core.middleware import rate_limit_middleware, token_validation_middleware
from .core.config import get_settings
from .core.logging import get_logger, AuditLogger
from .core.error_handling import ErrorHandler, KisaanCenterException
import logging
import time

# Import database manager
from .database import db_manager

# Get configuration settings
settings = get_settings()

# Configure enhanced logging
logger = get_logger(__name__)
audit_logger = AuditLogger()

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
from .api.simple_endpoints import users_router, shops_router, products_router, payments_router, credits_router
from .features.transaction.api.transaction_endpoints import router as transactions_router
from .api.owner_admin import router as superadmin_router
from .api.owner_products import router as owner_products_router

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
main_router.include_router(superadmin_router, prefix="/api/v1")
main_router.include_router(owner_products_router, prefix="/api/v1")
main_router.include_router(owner_products_router, prefix="/api/v1")

# Include the main router in the app
app.include_router(main_router)

# Add the enhanced middleware stack
from .core.middleware import (
    add_rate_limiting_middleware, 
    add_cors_middleware,
    ErrorHandlingMiddleware,
    RequestValidationMiddleware,
    AuthenticationMiddleware,
    SecurityHeadersMiddleware,
    HealthCheckMiddleware
)

# Add middleware in reverse order (last added = first executed)
add_cors_middleware(app)
add_rate_limiting_middleware(app)

# Add enhanced middleware stack
app.add_middleware(HealthCheckMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuthenticationMiddleware)
app.add_middleware(RequestValidationMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

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

# Enhanced error handlers using our error handling system
error_handler = ErrorHandler()

@app.exception_handler(HTTPException)
async def enhanced_http_exception_handler(request: Request, exc: HTTPException):
    """Enhanced HTTP exception handler with comprehensive error tracking"""
    try:
        # Log the error with context
        audit_logger.log_error(
            error_type=type(exc).__name__,
            error_message=exc.detail,
            request_path=str(request.url),
            status_code=exc.status_code,
            user_id=getattr(request.state, 'user_id', None)
        )
        
        return await error_handler.handle_http_exception(request, exc)
    except Exception as e:
        logger.error(f"Error in HTTP exception handler: {str(e)}")
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

@app.exception_handler(KisaanCenterException)
async def enhanced_kisaan_exception_handler(request: Request, exc: KisaanCenterException):
    """Enhanced KisaanCenter exception handler with full error tracking"""
    return await error_handler.handle_kisaan_exception(request, exc)

@app.exception_handler(Exception)
async def enhanced_global_exception_handler(request: Request, exc: Exception):
    """Enhanced global exception handler for unhandled exceptions"""
    try:
        # Log unhandled exception with full context
        audit_logger.log_error(
            error_type=type(exc).__name__,
            error_message=str(exc),
            request_path=str(request.url),
            status_code=500,
            user_id=getattr(request.state, 'user_id', None)
        )
        
        return await error_handler.handle_general_exception(request, exc)
    except Exception as handler_error:
        logger.error(f"Critical error in global exception handler: {str(handler_error)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Critical system error",
                "error_code": "CRITICAL_ERROR",
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
def enhanced_health_check():
    """Comprehensive health check endpoint with monitoring integration"""
    start_time = time.time()
    
    try:
        # Test database connection
        db_status = "connected" if db_manager.test_connection() else "disconnected"
        
        # Get connection info
        db_info = db_manager.get_connection_info()
        
        # Calculate response time
        response_time = time.time() - start_time
        
        # Determine overall health status
        is_healthy = db_status == "connected"
        status = "healthy" if is_healthy else "degraded"
        
        # Log health check
        if is_healthy:
            logger.info(f"Health check passed - Response time: {response_time:.3f}s")
        else:
            logger.warning(f"Health check failed - Database: {db_status}")
        
        health_data = {
            "status": status,
            "timestamp": time.time(),
            "version": "1.0.0",
            "response_time_ms": round(response_time * 1000, 2),
            "services": {
                "api": "operational",
                "database": db_status,
                "cache": "operational",  # TODO: Add Redis health check when available
                "logging": "operational",
                "error_handling": "operational"
            },
            "database_info": db_info,
            "system": {
                "uptime": "Available via /metrics endpoint",
                "environment": settings.environment,
                "debug_mode": settings.debug_mode
            }
        }
        
        # Log successful health check to audit trail
        audit_logger.log_system_event(
            event_type="health_check",
            details={"status": status, "response_time": response_time}
        )
        
        return health_data
        
    except Exception as e:
        logger.error(f"Health check failed with exception: {str(e)}")
        
        # Log failed health check
        audit_logger.log_error(
            error_type="HealthCheckError",
            error_message=str(e),
            request_path="/health"
        )
        
        return {
            "status": "unhealthy",
            "timestamp": time.time(),
            "version": "1.0.0",
            "error": "Health check failed",
            "services": {
                "api": "degraded",
                "database": "unknown",
                "cache": "unknown"
            }
        }

@app.get("/api/v1/info", tags=["System"])
def enhanced_api_info():
    """Comprehensive API information and capabilities with configuration details"""
    try:
        # Log API info access
        logger.info("API info endpoint accessed")
        
        api_info = {
            "name": "Market Management System API",
            "version": "1.0.0",
            "description": "Enterprise-level agricultural market management system with enhanced monitoring and error handling",
            "environment": settings.environment,
            "debug_mode": settings.debug_mode,
            "features": [
                "Multi-tenant shop management",
                "Three-party transaction completion model", 
                "Real-time stock management",
                "Flexible payment systems",
                "Credit management",
                "Commission tracking",
                "Comprehensive audit trail",
                "Enhanced error handling and monitoring",
                "Structured logging with request tracking",
                "Security headers and rate limiting",
                "Health monitoring and metrics"
            ],
            "endpoints": {
                "users": "/api/v1/users",
                "shops": "/api/v1/shops", 
                "products": "/api/v1/products",
                "transactions": "/api/v1/transactions",
                "payments": "/api/v1/payments",
                "credits": "/api/v1/credits",
                "subscriptions": "/api/v1/subscriptions",
                "stock": "/api/v1/farmer-stock",
                "super_admin": "/api/v1/admin"
            },
            "documentation": {
                "swagger": "/docs",
                "redoc": "/redoc",
                "openapi": "/openapi.json"
            },
            "monitoring": {
                "health": "/health",
                "metrics": "/metrics",  # TODO: Implement metrics endpoint
                "status": "operational"
            },
            "security": {
                "authentication": "JWT Token based",
                "rate_limiting": "Enabled",
                "cors": "Configured",
                "security_headers": "Enabled"
            },
            "database": {
                "status": "connected" if db_manager.test_connection() else "disconnected",
                "type": "PostgreSQL"  # Based on connection info
            }
        }
        
        # Log successful API info access
        audit_logger.log_system_event(
            event_type="api_info_access",
            details={"endpoint": "/api/v1/info"}
        )
        
        return api_info
        
    except Exception as e:
        logger.error(f"Error generating API info: {str(e)}")
        
        # Log error
        audit_logger.log_error(
            error_type="APIInfoError",
            error_message=str(e),
            request_path="/api/v1/info"
        )
        
        # Return basic info even on error
        return {
            "name": "Market Management System API",
            "version": "1.0.0",
            "status": "error",
            "message": "Unable to generate complete API information"
        }
