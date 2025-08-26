"""
Core module initialization.

This module provides core functionality including:
- Configuration management
- Security utilities
- Logging setup
- Common exceptions
- Application constants
"""

from .config import settings, get_settings
from .security import SecurityUtils, get_current_user_id, require_roles
from .logging import setup_logging, get_logger, LoggerMixin
from .exceptions import (
    BusinessLogicError,
    ValidationError,
    NotFoundError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError
)

__all__ = [
    # Configuration
    "settings",
    "get_settings",
    
    # Security
    "SecurityUtils",
    "get_current_user_id", 
    "require_roles",
    
    # Logging
    "setup_logging",
    "get_logger",
    "LoggerMixin",
    
    # Exceptions
    "BusinessLogicError",
    "ValidationError",
    "NotFoundError",
    "AuthenticationError",
    "AuthorizationError",
    "DatabaseError",
]
