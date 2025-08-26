"""
Core application exceptions.

This module defines custom exceptions used throughout the application.
All exceptions inherit from a base KisaanCenterException for consistent error handling.
"""
from typing import Optional, Any, Dict
from fastapi import HTTPException, status


class KisaanCenterException(Exception):
    """Base exception for all application-specific errors."""
    
    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(KisaanCenterException):
    """Raised when input validation fails."""
    
    def __init__(
        self,
        message: str = "Validation failed",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if field:
            message = f"Validation failed for field '{field}': {message}"
        super().__init__(message, "VALIDATION_ERROR", details)


class NotFoundError(KisaanCenterException):
    """Raised when a requested resource is not found."""
    
    def __init__(
        self,
        resource: str,
        identifier: Any = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if identifier:
            message = f"{resource} with identifier '{identifier}' not found"
        else:
            message = f"{resource} not found"
        super().__init__(message, "NOT_FOUND", details)


class BusinessLogicError(KisaanCenterException):
    """Raised when business logic rules are violated."""
    
    def __init__(
        self,
        message: str,
        rule: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if rule:
            details = details or {}
            details["violated_rule"] = rule
        super().__init__(message, "BUSINESS_LOGIC_ERROR", details)


class AuthenticationError(KisaanCenterException):
    """Raised when authentication fails."""
    
    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "AUTHENTICATION_ERROR", details)


class AuthorizationError(KisaanCenterException):
    """Raised when authorization fails."""
    
    def __init__(
        self,
        message: str = "Access denied",
        required_role: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if required_role:
            details = details or {}
            details["required_role"] = required_role
        super().__init__(message, "AUTHORIZATION_ERROR", details)


class DatabaseError(KisaanCenterException):
    """Raised when database operations fail."""
    
    def __init__(
        self,
        message: str = "Database operation failed",
        operation: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if operation:
            details = details or {}
            details["operation"] = operation
        super().__init__(message, "DATABASE_ERROR", details)


class ConcurrencyError(KisaanCenterException):
    """Raised when concurrent modification is detected."""
    
    def __init__(
        self,
        message: str = "Resource was modified by another process",
        resource: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if resource:
            details = details or {}
            details["resource"] = resource
        super().__init__(message, "CONCURRENCY_ERROR", details)


class ConfigurationError(KisaanCenterException):
    """Raised when configuration is invalid or missing."""
    
    def __init__(
        self,
        message: str = "Configuration error",
        config_key: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if config_key:
            details = details or {}
            details["config_key"] = config_key
        super().__init__(message, "CONFIGURATION_ERROR", details)


class ExternalServiceError(KisaanCenterException):
    """Raised when external service calls fail."""
    
    def __init__(
        self,
        message: str = "External service error",
        service_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if service_name:
            details = details or {}
            details["service_name"] = service_name
        super().__init__(message, "EXTERNAL_SERVICE_ERROR", details)


def exception_to_http_exception(exc: KisaanCenterException) -> HTTPException:
    """Convert application exception to HTTP exception."""
    
    status_map = {
        "VALIDATION_ERROR": status.HTTP_400_BAD_REQUEST,
        "NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "BUSINESS_LOGIC_ERROR": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "AUTHENTICATION_ERROR": status.HTTP_401_UNAUTHORIZED,
        "AUTHORIZATION_ERROR": status.HTTP_403_FORBIDDEN,
        "DATABASE_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "CONCURRENCY_ERROR": status.HTTP_409_CONFLICT,
        "CONFIGURATION_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "EXTERNAL_SERVICE_ERROR": status.HTTP_503_SERVICE_UNAVAILABLE,
    }
    
    status_code = status_map.get(exc.error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
            "details": exc.details
        }
    )
