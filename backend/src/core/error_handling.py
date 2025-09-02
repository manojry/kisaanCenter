"""
Enhanced Error Handling and Exception Management.

This module provides comprehensive error handling with:
- Custom exception hierarchy
- Structured error responses
- Error tracking and logging
- Request context preservation
- Error recovery mechanisms
"""
import traceback
import uuid
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum

from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from starlette.status import *

from src.core.logging import get_logger, audit_logger, set_request_id

logger = get_logger(__name__)

class ErrorSeverity(Enum):
    """Error severity levels for monitoring and alerting."""
    LOW = "low"
    MEDIUM = "medium"  
    HIGH = "high"
    CRITICAL = "critical"

class ErrorCategory(Enum):
    """Error categories for classification and metrics."""
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    BUSINESS_LOGIC = "business_logic"
    DATA_INTEGRITY = "data_integrity"
    EXTERNAL_SERVICE = "external_service"
    SYSTEM = "system"
    NETWORK = "network"

class ErrorContext:
    """Enhanced error context for better debugging."""
    
    def __init__(
        self,
        request: Optional[Request] = None,
        user_id: Optional[int] = None,
        operation: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ):
        self.request_id = str(uuid.uuid4())[:8] if request else None
        self.timestamp = datetime.utcnow()
        self.user_id = user_id
        self.operation = operation
        self.resource_type = resource_type  
        self.resource_id = resource_id
        self.request_info = self._extract_request_info(request) if request else {}
        
        # Set request ID in logging context
        if self.request_id:
            set_request_id(self.request_id)
    
    def _extract_request_info(self, request: Request) -> Dict[str, Any]:
        """Extract relevant request information."""
        return {
            'method': request.method,
            'url': str(request.url),
            'path': request.url.path,
            'query_params': dict(request.query_params),
            'headers': {
                'user-agent': request.headers.get('user-agent'),
                'content-type': request.headers.get('content-type'),
                'x-forwarded-for': request.headers.get('x-forwarded-for'),
            },
            'client_ip': request.client.host if request.client else None
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary."""
        return {
            'request_id': self.request_id,
            'timestamp': self.timestamp.isoformat(),
            'user_id': self.user_id,
            'operation': self.operation,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'request_info': self.request_info
        }

class EnhancedKisaanCenterException(Exception):
    """Enhanced base exception with comprehensive error tracking."""
    
    def __init__(
        self,
        message: str,
        error_code: str,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        category: ErrorCategory = ErrorCategory.SYSTEM,
        details: Optional[Dict[str, Any]] = None,
        user_message: Optional[str] = None,
        recoverable: bool = False,
        retry_after: Optional[int] = None,
        context: Optional[ErrorContext] = None
    ):
        self.message = message
        self.error_code = error_code
        self.severity = severity
        self.category = category
        self.details = details or {}
        self.user_message = user_message or message
        self.recoverable = recoverable
        self.retry_after = retry_after
        self.context = context or ErrorContext()
        
        # Generate trace ID for correlation
        self.trace_id = str(uuid.uuid4())
        
        super().__init__(self.message)
    
    def to_http_response(self) -> JSONResponse:
        """Convert to structured HTTP response."""
        status_code = self._get_http_status()
        
        response_data = {
            "success": False,
            "error": {
                "message": self.user_message,
                "code": self.error_code,
                "category": self.category.value,
                "severity": self.severity.value,
                "trace_id": self.trace_id,
                "recoverable": self.recoverable,
                "timestamp": self.context.timestamp.isoformat()
            }
        }
        
        # Add context for debugging (only in development)
        if self.details:
            response_data["error"]["details"] = self.details
        
        if self.retry_after:
            response_data["error"]["retry_after"] = self.retry_after
        
        if self.context.request_id:
            response_data["error"]["request_id"] = self.context.request_id
        
        return JSONResponse(
            status_code=status_code,
            content=response_data,
            headers={"X-Trace-ID": self.trace_id} if self.trace_id else {}
        )
    
    def _get_http_status(self) -> int:
        """Map error categories to HTTP status codes."""
        category_status_map = {
            ErrorCategory.VALIDATION: HTTP_400_BAD_REQUEST,
            ErrorCategory.AUTHENTICATION: HTTP_401_UNAUTHORIZED,
            ErrorCategory.AUTHORIZATION: HTTP_403_FORBIDDEN,
            ErrorCategory.BUSINESS_LOGIC: HTTP_422_UNPROCESSABLE_ENTITY,
            ErrorCategory.DATA_INTEGRITY: HTTP_409_CONFLICT,
            ErrorCategory.EXTERNAL_SERVICE: HTTP_503_SERVICE_UNAVAILABLE,
            ErrorCategory.NETWORK: HTTP_503_SERVICE_UNAVAILABLE,
            ErrorCategory.SYSTEM: HTTP_500_INTERNAL_SERVER_ERROR
        }
        return category_status_map.get(self.category, HTTP_500_INTERNAL_SERVER_ERROR)
    
    def log_error(self):
        """Log error with appropriate severity level."""
        log_data = {
            "error_code": self.error_code,
            "category": self.category.value,
            "severity": self.severity.value,
            "trace_id": self.trace_id,
            "details": self.details,
            "context": self.context.to_dict()
        }
        
        if self.severity == ErrorSeverity.CRITICAL:
            logger.critical(self.message, extra=log_data, exc_info=True)
            # Send alert to monitoring systems
            audit_logger.log_security_event(
                f"CRITICAL_ERROR: {self.error_code}",
                severity="critical",
                **log_data
            )
        elif self.severity == ErrorSeverity.HIGH:
            logger.error(self.message, extra=log_data, exc_info=True)
        elif self.severity == ErrorSeverity.MEDIUM:
            logger.warning(self.message, extra=log_data)
        else:  # LOW
            logger.info(self.message, extra=log_data)

# Enhanced specific exceptions
class ValidationError(EnhancedKisaanCenterException):
    """Enhanced validation error."""
    
    def __init__(self, message: str, field: Optional[str] = None, context: Optional[ErrorContext] = None, **kwargs):
        if field:
            details = kwargs.get('details', {})
            details['field'] = field
            kwargs['details'] = details
        
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            severity=ErrorSeverity.LOW,
            category=ErrorCategory.VALIDATION,
            context=context,
            **kwargs
        )

class BusinessLogicError(EnhancedKisaanCenterException):
    """Enhanced business logic error."""
    
    def __init__(self, message: str, rule: Optional[str] = None, context: Optional[ErrorContext] = None, **kwargs):
        if rule:
            details = kwargs.get('details', {})
            details['violated_rule'] = rule
            kwargs['details'] = details
        
        super().__init__(
            message=message,
            error_code="BUSINESS_LOGIC_ERROR",
            severity=ErrorSeverity.MEDIUM,
            category=ErrorCategory.BUSINESS_LOGIC,
            context=context,
            **kwargs
        )

class NotFoundError(EnhancedKisaanCenterException):
    """Enhanced not found error."""
    
    def __init__(self, resource: str, identifier: Any = None, context: Optional[ErrorContext] = None, **kwargs):
        if identifier:
            message = f"{resource} with identifier '{identifier}' not found"
            details = kwargs.get('details', {})
            details.update({'resource': resource, 'identifier': str(identifier)})
            kwargs['details'] = details
        else:
            message = f"{resource} not found"
        
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            severity=ErrorSeverity.LOW,
            category=ErrorCategory.VALIDATION,
            user_message=f"The requested {resource.lower()} could not be found",
            context=context,
            **kwargs
        )

class AuthenticationError(EnhancedKisaanCenterException):
    """Enhanced authentication error."""
    
    def __init__(self, message: str = "Authentication failed", context: Optional[ErrorContext] = None, **kwargs):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.AUTHENTICATION,
            user_message="Authentication required or failed",
            context=context,
            **kwargs
        )

class AuthorizationError(EnhancedKisaanCenterException):
    """Enhanced authorization error."""
    
    def __init__(self, message: str = "Access denied", required_role: Optional[str] = None, context: Optional[ErrorContext] = None, **kwargs):
        if required_role:
            details = kwargs.get('details', {})
            details['required_role'] = required_role
            kwargs['details'] = details
        
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.AUTHORIZATION,
            user_message="You do not have permission to perform this action",
            context=context,
            **kwargs
        )

class DatabaseError(EnhancedKisaanCenterException):
    """Enhanced database error."""
    
    def __init__(self, message: str = "Database operation failed", operation: Optional[str] = None, context: Optional[ErrorContext] = None, **kwargs):
        if operation:
            details = kwargs.get('details', {})
            details['operation'] = operation
            kwargs['details'] = details
        
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.SYSTEM,
            user_message="A database error occurred. Please try again later",
            recoverable=True,
            retry_after=30,
            context=context,
            **kwargs
        )

class ExternalServiceError(EnhancedKisaanCenterException):
    """Enhanced external service error."""
    
    def __init__(self, service: str, message: str = None, context: Optional[ErrorContext] = None, **kwargs):
        message = message or f"External service '{service}' is unavailable"
        details = kwargs.get('details', {})
        details['service'] = service
        kwargs['details'] = details
        
        super().__init__(
            message=message,
            error_code="EXTERNAL_SERVICE_ERROR",
            severity=ErrorSeverity.MEDIUM,
            category=ErrorCategory.EXTERNAL_SERVICE,
            user_message="External service temporarily unavailable. Please try again later",
            recoverable=True,
            retry_after=60,
            context=context,
            **kwargs
        )

class ErrorTracker:
    """Track and analyze application errors."""
    
    def __init__(self):
        self.error_counts: Dict[str, int] = {}
        self.error_patterns: List[Dict[str, Any]] = []
    
    def track_error(self, error: EnhancedKisaanCenterException):
        """Track error occurrence."""
        error_key = f"{error.category.value}:{error.error_code}"
        self.error_counts[error_key] = self.error_counts.get(error_key, 0) + 1
        
        # Store pattern for analysis
        pattern = {
            'timestamp': error.context.timestamp.isoformat(),
            'category': error.category.value,
            'code': error.error_code,
            'severity': error.severity.value,
            'trace_id': error.trace_id,
            'operation': error.context.operation,
            'resource_type': error.context.resource_type
        }
        self.error_patterns.append(pattern)
        
        # Keep only recent patterns (last 1000)
        if len(self.error_patterns) > 1000:
            self.error_patterns = self.error_patterns[-1000:]
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get error summary for monitoring."""
        return {
            'total_errors': len(self.error_patterns),
            'error_counts': self.error_counts,
            'recent_patterns': self.error_patterns[-10:] if self.error_patterns else []
        }

# Global error tracker
error_tracker = ErrorTracker()

def handle_exception(
    exc: Exception,
    request: Optional[Request] = None,
    operation: Optional[str] = None,
    user_id: Optional[int] = None
) -> JSONResponse:
    """Convert any exception to structured response."""
    
    context = ErrorContext(
        request=request,
        user_id=user_id,
        operation=operation
    )
    
    if isinstance(exc, EnhancedKisaanCenterException):
        # Already enhanced exception
        exc.context = context
        enhanced_exc = exc
    elif isinstance(exc, HTTPException):
        # Convert FastAPI HTTPException
        enhanced_exc = EnhancedKisaanCenterException(
            message=str(exc.detail),
            error_code=f"HTTP_{exc.status_code}",
            severity=ErrorSeverity.MEDIUM,
            category=ErrorCategory.VALIDATION,
            context=context
        )
    else:
        # Convert generic exception
        enhanced_exc = EnhancedKisaanCenterException(
            message=str(exc),
            error_code="INTERNAL_ERROR",
            severity=ErrorSeverity.CRITICAL,
            category=ErrorCategory.SYSTEM,
            user_message="An unexpected error occurred. Please try again later",
            context=context,
            details={'exception_type': exc.__class__.__name__}
        )
    
    # Log and track the error
    enhanced_exc.log_error()
    error_tracker.track_error(enhanced_exc)
    
    return enhanced_exc.to_http_response()

# Decorator for automatic error handling
def handle_errors(operation: str = None):
    """Decorator to automatically handle errors in endpoints."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as exc:
                # Extract request and user info from arguments if available
                request = None
                user_id = None
                
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
                
                for arg in args + tuple(kwargs.values()):
                    if hasattr(arg, 'id'):
                        user_id = getattr(arg, 'id', None)
                        break
                
                return handle_exception(exc, request, operation, user_id)
        
        return wrapper
    return decorator


class ErrorHandler:
    """Main error handler class for FastAPI application integration."""
    
    def __init__(self):
        self.error_tracker = error_tracker
        from .logging import get_logger
        self.logger = get_logger(__name__)
    
    async def handle_http_exception(self, request, exc):
        """Handle FastAPI HTTPException with enhanced error tracking."""
        try:
            context = ErrorContext(
                request_id=getattr(request.state, 'request_id', None),
                user_id=getattr(request.state, 'user_id', None),
                endpoint=str(request.url.path),
                method=request.method,
                timestamp=time.time(),
                additional_data={
                    'status_code': exc.status_code,
                    'detail': exc.detail,
                    'headers': dict(exc.headers) if exc.headers else {}
                }
            )
            
            enhanced_exc = EnhancedKisaanCenterException(
                message=exc.detail,
                error_code=f"HTTP_{exc.status_code}",
                severity=ErrorSeverity.MEDIUM if exc.status_code < 500 else ErrorSeverity.HIGH,
                category=ErrorCategory.CLIENT if exc.status_code < 500 else ErrorCategory.SYSTEM,
                context=context
            )
            
            enhanced_exc.log_error()
            self.error_tracker.track_error(enhanced_exc)
            
            return enhanced_exc.to_http_response(exc.status_code)
            
        except Exception as e:
            self.logger.error(f"Error in HTTP exception handler: {str(e)}")
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "success": False,
                    "message": exc.detail,
                    "error_code": f"HTTP_{exc.status_code}",
                    "timestamp": time.time()
                }
            )
    
    async def handle_kisaan_exception(self, request, exc: EnhancedKisaanCenterException):
        """Handle our custom KisaanCenter exceptions."""
        try:
            # Update context with request information
            if exc.context:
                exc.context.request_id = getattr(request.state, 'request_id', None)
                exc.context.user_id = getattr(request.state, 'user_id', None)
                exc.context.endpoint = str(request.url.path)
                exc.context.method = request.method
            
            exc.log_error()
            self.error_tracker.track_error(exc)
            
            return exc.to_http_response()
            
        except Exception as e:
            self.logger.error(f"Error in KisaanCenter exception handler: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Error processing custom exception",
                    "error_code": "HANDLER_ERROR",
                    "timestamp": time.time()
                }
            )
    
    async def handle_general_exception(self, request, exc: Exception):
        """Handle general unhandled exceptions."""
        try:
            return handle_exception(
                exc=exc,
                request=request,
                operation="general_handler",
                user_id=getattr(request.state, 'user_id', None)
            )
        except Exception as e:
            self.logger.error(f"Critical error in general exception handler: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Critical system error",
                    "error_code": "CRITICAL_ERROR",
                    "timestamp": time.time()
                }
            )


# Main exception handler function - for backward compatibility
KisaanCenterException = EnhancedKisaanCenterException
