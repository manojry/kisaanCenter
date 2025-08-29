
import time
import hashlib
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Set
import logging

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate_limit_requests: int = 100, rate_limit_window: int = 3600):
        super().__init__(app)
        self.rate_limit_requests = rate_limit_requests
        self.rate_limit_window = rate_limit_window
        self.request_counts: Dict[str, list] = defaultdict(list)
        self.blocked_ips: Set[str] = set()
        
    async def dispatch(self, request: Request, call_next):
        client_ip = self._get_client_ip(request)
        
        # Check if IP is blocked
        if client_ip in self.blocked_ips:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="IP address is temporarily blocked"
            )
        
        # Rate limiting
        if self._is_rate_limited(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        # Security headers check
        self._validate_security_headers(request)
        
        # Process request
        response = await call_next(request)
        
        # Add security headers to response
        self._add_security_headers(response)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _is_rate_limited(self, client_ip: str) -> bool:
        """Check if client IP is rate limited"""
        now = time.time()
        
        # Clean old requests
        self.request_counts[client_ip] = [
            req_time for req_time in self.request_counts[client_ip]
            if now - req_time < self.rate_limit_window
        ]
        
        # Check if rate limit exceeded
        if len(self.request_counts[client_ip]) >= self.rate_limit_requests:
            # Block IP temporarily
            self.blocked_ips.add(client_ip)
            return True
        
        # Record this request
        self.request_counts[client_ip].append(now)
        return False
    
    def _validate_security_headers(self, request: Request):
        """Validate security headers"""
        # Example validation - can be extended
        user_agent = request.headers.get("User-Agent", "")
        if "curl" in user_agent.lower():
            # Log suspicious activity
            logger.warning(f"Suspicious request detected from IP: {self._get_client_ip(request)}")
    
    def _add_security_headers(self, response):
        """Add security headers to response"""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
o