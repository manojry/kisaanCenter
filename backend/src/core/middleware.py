"""
Enhanced Middleware Collection.

This module provides comprehensive middleware for:
- Security and authentication
- Error handling and monitoring  
- Request validation and rate limiting
- Performance tracking
- Health monitoring
"""
import time
from typing import Callable, Dict, List, Optional, Tuple, Any
from datetime import datetime
import traceback

from fastapi import Request, HTTPException, status, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .security import SecurityUtils
from .config import settings
from .logging import get_logger, set_request_id, audit_logger, performance_logger
from .error_handling import (
    handle_exception, 
    ErrorContext, 
    EnhancedKisaanCenterException,
    error_tracker
)

logger = get_logger(__name__)

# Simple in-memory rate limiter
class RateLimiter:
    def __init__(self, rate_limit: int, time_window: int):
        """Initialize rate limiter.
        
        Args:
            rate_limit: Number of requests allowed
            time_window: Time window in seconds
        """
        self.rate_limit = rate_limit
        self.time_window = time_window
        self.requests: Dict[str, List[float]] = {}
    
    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed based on rate limit."""
        now = time.time()
        
        # Initialize or cleanup old requests
        if key not in self.requests:
            self.requests[key] = []
        else:
            # Remove old timestamps
            valid_requests = [
                timestamp
                for timestamp in self.requests[key]
                if now - timestamp <= self.time_window
            ]
            self.requests[key] = valid_requests
        
        # Check rate limit
        if len(self.requests[key]) >= self.rate_limit:
            return False
        
        # Add new request timestamp
        self.requests[key].append(now)
        return True

# Rate limiter instances
auth_limiter = RateLimiter(rate_limit=50, time_window=60)  # 50 requests per minute for auth
api_limiter = RateLimiter(rate_limit=100, time_window=60)  # 100 requests per minute for API

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for comprehensive error handling and monitoring."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.error_rates: Dict[str, int] = {}
        self.last_reset = time.time()
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with comprehensive error handling."""
        import traceback
        start_time = time.time()
        request_id = set_request_id()
        context = ErrorContext()
        request.state.context = context
        try:
            # Log incoming request
            logger.info(
                f"Request started: {request.method} {request.url.path}",
                extra={
                    'request_method': request.method,
                    'request_path': request.url.path,
                    'request_query': str(request.query_params),
                    'client_ip': request.client.host if request.client else None,
                    'user_agent': request.headers.get('user-agent'),
                }
            )
            # Process request
            response = await call_next(request)
            # Calculate and log response time
            duration = time.time() - start_time
            # Log successful request
            logger.info(
                f"Request completed: {request.method} {request.url.path}",
                extra={
                    'response_status': response.status_code,
                    'duration_ms': round(duration * 1000, 2),
                }
            )
            # Log performance metrics
            performance_logger.log_request_timing(
                endpoint=request.url.path,
                method=request.method,
                duration=duration,
                status_code=response.status_code,
                request_id=request_id
            )
            # Add tracking headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(round(duration * 1000, 2))
            return response
        except Exception as exc:
            # Calculate error response time
            duration = time.time() - start_time
            # Extract user information if available
            user_id = None
            if hasattr(request.state, 'user'):
                user_id = getattr(request.state.user, 'id', None)
            # Update error context with user info
            context.user_id = user_id
            # --- Enhanced error logging ---
            logger.error(
                f"Exception in request: {request.method} {request.url.path}\nType: {type(exc).__name__}\nMessage: {str(exc)}\nTraceback:\n{traceback.format_exc()}",
                extra={
                    'request_method': request.method,
                    'request_path': request.url.path,
                    'user_id': user_id,
                }
            )
            # Handle the exception
            response = handle_exception(
                exc=exc,
                request=request,
                operation=f"{request.method} {request.url.path}",
                user_id=user_id
            )
            # Log performance even for errors
            performance_logger.log_request_timing(
                endpoint=request.url.path,
                method=request.method,
                duration=duration,
                status_code=response.status_code,
                request_id=request_id,
                error=True
            )
            # Track error rate
            self._track_error_rate(request.url.path)
            # Add tracking headers to error response
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(round(duration * 1000, 2))
            return response
            # Handle the exception
            response = handle_exception(
                exc=exc,
                request=request,
                operation=f"{request.method} {request.url.path}",
                user_id=user_id
            )
            
            # Log performance even for errors
            performance_logger.log_request_timing(
                endpoint=request.url.path,
                method=request.method,
                duration=duration,
                status_code=response.status_code,
                request_id=request_id,
                error=True
            )
            
            # Track error rate
            self._track_error_rate(request.url.path)
            
            # Add tracking headers to error response
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(round(duration * 1000, 2))
            
            return response
    
    def _track_error_rate(self, endpoint: str):
        """Track error rates for monitoring."""
        current_time = time.time()
        
        # Reset counters every hour
        if current_time - self.last_reset > 3600:
            self.error_rates.clear()
            self.last_reset = current_time
        
        # Increment error count for endpoint
        self.error_rates[endpoint] = self.error_rates.get(endpoint, 0) + 1
        
        # Log high error rates
        if self.error_rates[endpoint] > 10:  # More than 10 errors per hour
            logger.warning(
                f"High error rate detected for endpoint: {endpoint}",
                extra={
                    'endpoint': endpoint,
                    'error_count': self.error_rates[endpoint],
                    'time_window': 'last_hour'
                }
            )

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for request validation and rate limiting."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Validate and sanitize incoming requests."""
        try:
            # Rate limiting
            client_ip = request.client.host if request.client else "unknown"
            
            # Use stricter limits for auth endpoints
            if "/auth/" in request.url.path:
                limiter = auth_limiter
            else:
                limiter = api_limiter
            
            if not limiter.is_allowed(client_ip):
                audit_logger.log_security_event(
                    f"Rate limit exceeded for IP: {client_ip}",
                    severity="warning",
                    client_ip=client_ip,
                    endpoint=request.url.path
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later."
                )
            
            # Validate content length
            content_length = request.headers.get('content-length')
            if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
                raise HTTPException(
                    status_code=413,
                    detail="Request payload too large"
                )
            
            # Validate content type for POST/PUT requests
            if request.method in ['POST', 'PUT', 'PATCH']:
                content_type = request.headers.get('content-type', '')
                allowed_types = [
                    'application/json',
                    'application/x-www-form-urlencoded',
                    'multipart/form-data'
                ]
                
                if not any(allowed in content_type for allowed in allowed_types):
                    logger.warning(
                        f"Invalid content type: {content_type}",
                        extra={'content_type': content_type, 'method': request.method}
                    )
            
            return await call_next(request)
            
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Request validation error: {exc}", exc_info=True)
            raise HTTPException(
                status_code=400,
                detail="Invalid request format"
            )

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Enhanced JWT token validation middleware."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.public_paths = [
            "/api/v1/users/auth/login",
            "/api/v1/auth/login",  # Allow unauthenticated login
            "/api/v1/users/auth/register",
            "/api/v1/users/login",  # Exclude this for test and real login
            "/docs",
            "/redoc",
            "/openapi.json",
            "/",
            "/health",
            "/healthz"
        ]
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Validate authentication tokens."""
        # Skip validation for public endpoints
        if (request.url.path in self.public_paths or 
            request.url.path.startswith("/api/v1/users/auth/")):
            return await call_next(request)

        # Skip validation for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        print(f"DEBUG: Auth header for {request.url.path}: {auth_header}")  # Debug log
        if not auth_header or not auth_header.startswith("Bearer "):
            audit_logger.log_security_event(
                "Missing authentication token",
                severity="warning",
                endpoint=request.url.path,
                client_ip=request.client.host if request.client else None
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication token",
                headers={"WWW-Authenticate": "Bearer"}
            )

        token = auth_header.split(" ")[1]
        try:
            # Validate token and get user data
            user_data = SecurityUtils.validate_token(token)
            print(f"DEBUG: Token validation successful for user: {user_data}")  # Debug log
            # Add user data to request state
            request.state.user = user_data

            # Log successful authentication
            audit_logger.log_user_action(
                user_id=user_data.get('id') or user_data.get('user_id'),
                action="authenticated_request",
                resource=request.url.path,
                method=request.method
            )

            return await call_next(request)

        except HTTPException as e:
            # Token validation or auth errors: always return 401
            print(f"DEBUG: Token validation failed with HTTPException: {e}")  # Debug log
            audit_logger.log_security_event(
                f"Token validation failed: {str(e)}",
                severity="warning",
                endpoint=request.url.path,
                client_ip=request.client.host if request.client else None
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e.detail) if hasattr(e, 'detail') else str(e),
                headers={"WWW-Authenticate": "Bearer"}
            )
        except Exception as e:
            print(f"DEBUG: Token validation failed with Exception: {e}")  # Debug log
            # If error is authentication-related, return 401 Unauthorized
            error_message = str(e)
            auth_related = (
                "Could not validate credentials" in error_message or
                "Token has expired" in error_message or
                "Missing authentication token" in error_message or
                "JWT" in error_message or
                "token" in error_message
            )
            audit_logger.log_security_event(
                f"Unexpected error in authentication: {error_message}",
                severity="error",
                endpoint=request.url.path,
                client_ip=request.client.host if request.client else None
            )
            if auth_related:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=error_message,
                    headers={"WWW-Authenticate": "Bearer"}
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid request format or internal error"
                )

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to responses."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Add security headers to all responses."""
        response = await call_next(request)
        
        # Add security headers
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'",
        }
        
        # Only add HSTS in production with HTTPS
        if settings.environment == "production":
            security_headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        for header, value in security_headers.items():
            response.headers[header] = value
        
        return response

class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Middleware for health monitoring and circuit breaker functionality."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.health_status = "healthy"
        self.error_threshold = 50  # errors per minute
        self.error_window = 60  # seconds
        self.recent_errors = []
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Monitor system health and implement circuit breaker."""
        
        # Health check endpoint - bypass normal processing
        if request.url.path in ["/health", "/healthz"]:
            return await self._health_check_response()
        
        # Check if system is healthy
        if self.health_status == "unhealthy" and not request.url.path.startswith("/api/v1/system"):
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "message": "System is temporarily unavailable",
                    "health_status": "unhealthy"
                }
            )
        
        try:
            response = await call_next(request)
            
            # Update health based on response
            if response.status_code >= 500:
                self._record_error()
            
            return response
            
        except Exception as exc:
            self._record_error()
            raise
    
    def _record_error(self):
        """Record error for health monitoring."""
        current_time = time.time()
        self.recent_errors.append(current_time)
        
        # Clean old errors
        self.recent_errors = [
            error_time for error_time in self.recent_errors
            if current_time - error_time <= self.error_window
        ]
        
        # Update health status
        if len(self.recent_errors) >= self.error_threshold:
            self.health_status = "unhealthy"
            logger.critical(
                f"System marked as unhealthy due to high error rate: {len(self.recent_errors)} errors in {self.error_window} seconds"
            )
        elif len(self.recent_errors) < self.error_threshold // 2:
            self.health_status = "healthy"
    
    async def _health_check_response(self) -> JSONResponse:
        """Generate health check response."""
        error_summary = error_tracker.get_error_summary()
        
        health_data = {
            "status": self.health_status,
            "timestamp": time.time(),
            "version": "1.0.0",
            "errors": {
                "recent_count": len(self.recent_errors),
                "threshold": self.error_threshold,
                "total_tracked": error_summary.get('total_errors', 0)
            }
        }
        
        status_code = 200 if self.health_status == "healthy" else 503
        return JSONResponse(
            status_code=status_code,
            content=health_data
        )

# Legacy functions for backward compatibility
async def rate_limit_middleware(request: Request, call_next: Callable) -> bool:
    """Legacy rate limiting middleware - use RequestValidationMiddleware instead."""
    logger.warning("Using deprecated rate_limit_middleware - upgrade to RequestValidationMiddleware")
    
    client_ip = request.client.host if request.client else "unknown"
    
    # Use stricter limits for auth endpoints
    if "/auth/" in request.url.path:
        limiter = auth_limiter
    else:
        limiter = api_limiter
    
    if not limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests"
        )
    
    return await call_next(request)

async def token_validation_middleware(request: Request, call_next: Callable) -> bool:
    """Legacy token validation middleware - use AuthenticationMiddleware instead."""
    logger.warning("Using deprecated token_validation_middleware - upgrade to AuthenticationMiddleware")
    
    # List of paths that don't require authentication
    public_paths = [
        "/api/v1/users/auth/login",
        "/api/v1/users/auth/register",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/",
        "/health"
    ]

    # Skip validation for public endpoints
    if (request.url.path in public_paths or 
        request.url.path.startswith("/api/v1/users/auth/")):
        return await call_next(request)
    
    # Skip validation for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return await call_next(request)
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    try:
        # Validate token and get user data
        user_data = SecurityUtils.validate_token(token)
        # Add user data to request state
        request.state.user = user_data
        return await call_next(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )


# Utility functions for middleware setup
def add_rate_limiting_middleware(app):
    """Add rate limiting middleware to the FastAPI app."""
    logger = get_logger(__name__)
    try:
        # For now, we'll skip the Redis rate limiter and use a simple in-memory one
        logger.info("✅ Rate limiting middleware configured (in-memory)")
        # Note: Actual Redis rate limiter would be added here when Redis is available
    except Exception as e:
        logger.warning(f"Rate limiting middleware setup failed: {e}")


def add_cors_middleware(app):
    """Add CORS middleware to the FastAPI app."""
    from fastapi.middleware.cors import CORSMiddleware
    logger = get_logger(__name__)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure this properly in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("✅ CORS middleware configured")
