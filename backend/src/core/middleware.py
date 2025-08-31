"""Security middleware for rate limiting and token validation."""
import time
from typing import Callable, Dict, List, Optional, Tuple
from datetime import datetime
from fastapi import Request, HTTPException, status
from .security import SecurityUtils
from .config import settings

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
auth_limiter = RateLimiter(rate_limit=5, time_window=60)  # 5 requests per minute for auth
api_limiter = RateLimiter(rate_limit=100, time_window=60)  # 100 requests per minute for API

async def rate_limit_middleware(request: Request, call_next: Callable) -> bool:
    """Rate limiting middleware."""
    # Get client IP or fallback to a default key
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
    """JWT token validation middleware."""
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
