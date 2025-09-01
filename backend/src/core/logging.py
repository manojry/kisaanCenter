"""
Enhanced Structured Logging Configuration.

This module provides comprehensive logging setup with:
- Structured logging with JSON format support
- Request ID tracking
- Multiple log levels and handlers
- Audit logging capabilities
- Performance monitoring
"""
import logging
import logging.handlers
import json
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from contextvars import ContextVar

from src.core.config import settings

# Context variable for request tracking
request_id: ContextVar[Optional[str]] = ContextVar('request_id', default=None)

class RequestIDFilter(logging.Filter):
    """Add request ID to log records."""
    
    def filter(self, record):
        record.request_id = request_id.get() or "no-request"
        return True

class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'request_id': getattr(record, 'request_id', 'no-request')
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 
                          'pathname', 'filename', 'module', 'lineno', 'funcName',
                          'created', 'msecs', 'relativeCreated', 'thread', 'threadName',
                          'processName', 'process', 'stack_info', 'exc_info', 'exc_text']:
                log_data['extra'] = log_data.get('extra', {})
                log_data['extra'][key] = value
        
        return json.dumps(log_data, default=str)

class AuditLogger:
    """Specialized logger for audit events."""
    
    def __init__(self):
        self.logger = logging.getLogger('audit')
        
    def log_user_action(self, user_id: int, action: str, resource: str, 
                       resource_id: Optional[str] = None, **extra):
        """Log user actions for audit trail."""
        self.logger.info(
            f"User action: {action}",
            extra={
                'audit_type': 'user_action',
                'user_id': user_id,
                'action': action,
                'resource': resource,
                'resource_id': resource_id,
                **extra
            }
        )
    
    def log_system_event(self, event: str, severity: str = 'info', **extra):
        """Log system events."""
        log_method = getattr(self.logger, severity.lower(), self.logger.info)
        log_method(
            f"System event: {event}",
            extra={
                'audit_type': 'system_event',
                'event': event,
                **extra
            }
        )
    
    def log_security_event(self, event: str, severity: str = 'warning', **extra):
        """Log security-related events."""
        log_method = getattr(self.logger, severity.lower(), self.logger.warning)
        log_method(
            f"Security event: {event}",
            extra={
                'audit_type': 'security_event',
                'event': event,
                **extra
            }
        )
    
    def log_error(self, error: str, **extra):
        """Log error events."""
        self.logger.error(
            f"Error event: {error}",
            extra={
                'audit_type': 'error_event',
                'error': error,
                **extra
            }
        )

class PerformanceLogger:
    """Performance monitoring and metrics logging."""
    
    def __init__(self):
        self.logger = logging.getLogger('performance')
    
    def log_request_timing(self, endpoint: str, method: str, duration: float, 
                          status_code: int, **extra):
        """Log API request performance metrics."""
        self.logger.info(
            f"Request performance: {method} {endpoint}",
            extra={
                'metric_type': 'request_timing',
                'endpoint': endpoint,
                'method': method,
                'duration_ms': round(duration * 1000, 2),
                'status_code': status_code,
                **extra
            }
        )
    
    def log_query_timing(self, query_type: str, duration: float, **extra):
        """Log database query performance."""
        self.logger.info(
            f"Query performance: {query_type}",
            extra={
                'metric_type': 'query_timing',
                'query_type': query_type,
                'duration_ms': round(duration * 1000, 2),
                **extra
            }
        )

def setup_logging(
    log_level: str = None,
    log_file: Optional[str] = None,
    enable_structured: bool = True
) -> None:
    """
    Set up enhanced application logging configuration.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (optional)
        enable_structured: Enable structured JSON logging
    """
    # Use settings defaults if not provided
    log_level = log_level or getattr(settings, 'LOG_LEVEL', 'INFO')
    log_file = log_file or getattr(settings, 'LOG_FILE', None)
    
    # Convert string level to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add request ID filter to all handlers
    request_filter = RequestIDFilter()
    
    # Choose formatter
    if enable_structured:
        formatter = StructuredFormatter()
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s'
        )
        console_formatter = formatter
    
    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(numeric_level)
    console_handler.addFilter(request_filter)
    root_logger.addHandler(console_handler)
    
    # Add main application file handler
    if log_file:
        app_file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5
        )
        app_file_handler.setFormatter(formatter)
        app_file_handler.setLevel(numeric_level)
        app_file_handler.addFilter(request_filter)
        root_logger.addHandler(app_file_handler)
    
    # Add error-specific file handler
    error_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)
    error_handler.addFilter(request_filter)
    root_logger.addHandler(error_handler)
    
    # Add audit log handler
    audit_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "audit.log",
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=20
    )
    audit_handler.setFormatter(formatter)
    audit_handler.setLevel(logging.INFO)
    audit_handler.addFilter(request_filter)
    
    # Configure audit logger
    audit_logger = logging.getLogger('audit')
    audit_logger.addHandler(audit_handler)
    audit_logger.propagate = False
    
    # Add performance log handler
    perf_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "performance.log",
        maxBytes=20 * 1024 * 1024,  # 20MB
        backupCount=10
    )
    perf_handler.setFormatter(formatter)
    perf_handler.setLevel(logging.INFO)
    perf_handler.addFilter(request_filter)
    
    # Configure performance logger
    perf_logger = logging.getLogger('performance')
    perf_logger.addHandler(perf_handler)
    perf_logger.propagate = False

def set_request_id(req_id: str = None) -> str:
    """Set request ID for current context."""
    if req_id is None:
        req_id = str(uuid.uuid4())[:8]
    request_id.set(req_id)
    return req_id

def get_request_id() -> Optional[str]:
    """Get current request ID."""
    return request_id.get()

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for the given name.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)

# Specialized logger instances
audit_logger = AuditLogger()
performance_logger = PerformanceLogger()

# Application loggers
api_logger = get_logger("kisaan_center.api")
db_logger = get_logger("kisaan_center.database")
auth_logger = get_logger("kisaan_center.auth")
business_logger = get_logger("kisaan_center.business")

class LoggerMixin:
    """Mixin to add logging capabilities to any class."""
    
    @property
    def logger(self) -> logging.Logger:
        """Get logger for this class."""
        return get_logger(f"{self.__class__.__module__}.{self.__class__.__name__}")

# Initialize enhanced logging when module is imported
setup_logging()
