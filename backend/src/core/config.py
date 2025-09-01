"""
Unified Core Application Configuration.

This module provides comprehensive configuration management with:
- Environment-based configuration with Pydantic validation
- Security settings with SecretStr protection  
- Database and external service configuration
- Business logic and API configuration
- File upload and logging configuration
- Legacy compatibility layer

This represents the best practices configuration system that combines
modern Pydantic validation with complete business settings coverage.
"""
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from functools import lru_cache
from pydantic import field_validator, Field, SecretStr
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)

class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    host: str = Field(default="localhost", description="Database host")
    port: int = Field(5432, description="Database port")
    name: str = Field(default="kisaan_center", description="Database name")
    user: str = Field(default="postgres", description="Database user")
    password: SecretStr = Field(default=SecretStr("password"), description="Database password")
    
    # Connection pool settings
    pool_size: int = Field(10, description="Connection pool size")
    max_overflow: int = Field(20, description="Max pool overflow")
    pool_timeout: int = Field(30, description="Pool timeout seconds")
    pool_recycle: int = Field(3600, description="Pool recycle seconds")
    
    # Advanced settings
    echo: bool = Field(False, description="Echo SQL queries")
    ssl_mode: str = Field("prefer", description="SSL mode")
    
    model_config = {
        'env_prefix': 'DB_',
        'case_sensitive': False
    }
    
    @property
    def url(self) -> str:
        """Generate database URL."""
        return f"postgresql://{self.user}:{self.password.get_secret_value()}@{self.host}:{self.port}/{self.name}"
    
    @property
    def async_url(self) -> str:
        """Generate async database URL."""
        return f"postgresql+asyncpg://{self.user}:{self.password.get_secret_value()}@{self.host}:{self.port}/{self.name}"

class RedisSettings(BaseSettings):
    """Redis configuration settings."""
    
    host: str = Field("localhost", description="Redis host")
    port: int = Field(6379, description="Redis port")
    db: int = Field(0, description="Redis database number")
    password: Optional[SecretStr] = Field(None, description="Redis password")
    
    # Connection settings
    max_connections: int = Field(100)
    socket_timeout: int = Field(5)
    socket_connect_timeout: int = Field(5)
    
    model_config = {
        'env_prefix': 'REDIS_',
        'case_sensitive': False
    }
    
    @property
    def url(self) -> str:
        """Generate Redis URL."""
        auth = f":{self.password.get_secret_value()}@" if self.password else ""
        return f"redis://{auth}{self.host}:{self.port}/{self.db}"

class SecuritySettings(BaseSettings):
    """Security configuration settings."""
    
    secret_key: SecretStr = Field(default=SecretStr("dev-secret-key-change-in-production"), description="JWT secret key")
    access_token_expire_minutes: int = Field(30)
    refresh_token_expire_days: int = Field(7)
    algorithm: str = Field("HS256")
    
    # Password settings
    password_min_length: int = Field(8)
    password_require_uppercase: bool = Field(True)
    password_require_lowercase: bool = Field(True)
    password_require_digits: bool = Field(True)
    password_require_special: bool = Field(False)
    
    # Rate limiting
    rate_limit_requests: int = Field(100)
    rate_limit_window: int = Field(60)
    
    # CORS settings
    allowed_origins: List[str] = Field(default_factory=list)
    allowed_methods: List[str] = Field(["GET", "POST", "PUT", "DELETE"])
    allowed_headers: List[str] = Field(["*"])
    
    model_config = {
        'env_prefix': '',  # No prefix, so SECRET_KEY is read directly
        'case_sensitive': False
    }
    
    @field_validator('allowed_origins', mode='before')
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v or ["http://localhost:3000", "http://localhost:5173"]

class LoggingSettings(BaseSettings):
    """Logging configuration settings."""
    
    level: str = Field("INFO", description="Logging level")
    format: str = Field(
        "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"
    )
    file_path: Optional[str] = Field(None, description="Log file path")
    max_file_size: int = Field(10 * 1024 * 1024)  # 10MB
    backup_count: int = Field(5)
    
    # Structured logging
    json_logs: bool = Field(False, description="Use JSON logging format")
    include_request_id: bool = Field(True)
    
    model_config = {
        'env_prefix': 'LOG_',
        'case_sensitive': False
    }

class APISettings(BaseSettings):
    """API configuration settings."""
    
    v1_prefix: str = Field("/api/v1", description="API v1 prefix")
    max_page_size: int = Field(100, description="Maximum page size")
    default_page_size: int = Field(20, description="Default page size")
    
    # Request and response settings
    request_timeout: int = Field(30, description="Request timeout in seconds")
    enable_compression: bool = Field(True, description="Enable response compression")
    max_request_size: int = Field(50 * 1024 * 1024)  # 50MB
    
    # API versioning
    api_version_header: str = Field("X-API-Version", description="API version header")
    default_api_version: str = Field("1.0", description="Default API version")
    
    model_config = {
        'env_prefix': 'API_',
        'case_sensitive': False
    }

class FileUploadSettings(BaseSettings):
    """File upload configuration settings."""
    
    max_size: int = Field(10 * 1024 * 1024, description="Max upload size in bytes (10MB)")
    allowed_types: List[str] = Field([
        "image/jpeg", "image/png", "image/gif", 
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ])
    allowed_extensions: List[str] = Field([".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"])
    storage_path: str = Field("uploads", description="File storage path")
    temp_dir: str = Field("tmp", description="Temporary upload directory")
    
    # Security settings
    enable_virus_scan: bool = Field(False, description="Enable virus scanning")
    quarantine_dir: str = Field("quarantine", description="Quarantine directory")
    
    # Storage optimization
    enable_compression: bool = Field(True, description="Compress uploaded files")
    image_resize_max_width: int = Field(1920, description="Max image width")
    image_resize_max_height: int = Field(1080, description="Max image height")
    
    model_config = {
        'env_prefix': 'UPLOAD_',
        'case_sensitive': False
    }
    
    @property
    def max_size_mb(self) -> float:
        """Get max size in MB."""
        return self.max_size / (1024 * 1024)

class BusinessSettings(BaseSettings):
    """Business logic configuration settings."""
    
    # Commission and fee settings
    default_commission_rate: float = Field(0.05, description="Default commission rate (5%)")
    min_commission_rate: float = Field(0.01, description="Minimum commission rate (1%)")
    max_commission_rate: float = Field(0.15, description="Maximum commission rate (15%)")
    
    # Credit and payment settings
    max_credit_limit: float = Field(10000.0, description="Maximum credit limit")
    default_credit_limit: float = Field(1000.0, description="Default credit limit")
    payment_due_days: int = Field(30, description="Payment due days")
    late_payment_fee_rate: float = Field(0.02, description="Late payment fee rate (2%)")
    
    # Business operation limits
    max_daily_transactions: int = Field(1000, description="Max daily transactions per shop")
    min_transaction_amount: float = Field(0.01, description="Minimum transaction amount")
    max_transaction_amount: float = Field(100000.0, description="Maximum transaction amount")
    
    # Subscription and pricing
    monthly_subscription_price: float = Field(29.99, description="Monthly subscription price")
    quarterly_subscription_discount: float = Field(0.10, description="Quarterly discount (10%)")
    yearly_subscription_discount: float = Field(0.20, description="Yearly discount (20%)")
    trial_period_days: int = Field(14, description="Trial period in days")
    
    # Resource limits per shop
    max_farmers_per_shop: int = Field(100, description="Maximum farmers per shop")
    max_buyers_per_shop: int = Field(500, description="Maximum buyers per shop")
    max_products_per_shop: int = Field(1000, description="Maximum products per shop")
    
    # Data retention and compliance
    data_retention_months: int = Field(36, description="Data retention period in months")
    max_data_retention_months: int = Field(84, description="Maximum data retention (7 years)")
    backup_retention_days: int = Field(90, description="Backup retention period")
    
    # Notification settings
    enable_email_notifications: bool = Field(True)
    enable_sms_notifications: bool = Field(False)
    notification_batch_size: int = Field(50)
    notification_retry_attempts: int = Field(3)
    
    # Fraud prevention
    enable_fraud_detection: bool = Field(True)
    max_failed_payment_attempts: int = Field(3)
    suspicious_activity_threshold: float = Field(10000.0)
    
    model_config = {
        'env_prefix': 'BUSINESS_',
        'case_sensitive': False
    }
    
    @field_validator('default_commission_rate', 'min_commission_rate', 'max_commission_rate')
    @classmethod
    def validate_commission_rates(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Commission rates must be between 0 and 1')
        return v
    
    @field_validator('data_retention_months')
    @classmethod
    def validate_data_retention(cls, v):
        if v > 84:  # 7 years maximum for compliance
            raise ValueError('Data retention cannot exceed 84 months (7 years)')
        return v

class ExternalServiceSettings(BaseSettings):
    """External service configuration settings."""
    
    # Email service
    email_provider: str = Field("smtp", description="Email provider")
    smtp_host: Optional[str] = Field(None)
    smtp_port: int = Field(587)
    smtp_user: Optional[str] = Field(None)
    smtp_password: Optional[SecretStr] = Field(None)
    
    # SMS service
    sms_provider: str = Field("twilio", description="SMS provider")
    sms_api_key: Optional[SecretStr] = Field(None)
    sms_api_secret: Optional[SecretStr] = Field(None)
    
    # Payment gateway
    payment_gateway: str = Field("stripe", description="Payment gateway")
    payment_api_key: Optional[SecretStr] = Field(None)
    payment_webhook_secret: Optional[SecretStr] = Field(None)
    
    # Analytics
    analytics_provider: Optional[str] = Field(None)
    analytics_api_key: Optional[SecretStr] = Field(None)
    
    model_config = {
        'env_prefix': 'EXTERNAL_',
        'case_sensitive': False
    }

class Settings(BaseSettings):
    """Main application settings."""
    
    # Application info
    app_name: str = Field("Market Management System API")
    app_version: str = Field("1.0.0")
    debug: bool = Field(False)
    environment: str = Field("development")
    
    # Server settings
    host: str = Field("0.0.0.0")
    port: int = Field(8000)
    reload: bool = Field(False)
    
    # Feature flags
    enable_metrics: bool = Field(True)
    enable_health_checks: bool = Field(True)
    enable_audit_logging: bool = Field(True)
    enable_swagger_docs: bool = Field(True)
    enable_request_logging: bool = Field(True)
    
    # Performance settings
    worker_connections: int = Field(1000)
    keepalive_timeout: int = Field(5)
    max_workers: int = Field(4)
    
    # External services
    webhook_secret: Optional[SecretStr] = Field(None)
    notification_service_url: Optional[str] = Field(None)
    
    # Configuration sub-sections
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    logging: LoggingSettings = Field(default_factory=LoggingSettings)
    api: APISettings = Field(default_factory=APISettings)
    uploads: FileUploadSettings = Field(default_factory=FileUploadSettings)
    business: BusinessSettings = Field(default_factory=BusinessSettings)
    external: ExternalServiceSettings = Field(default_factory=ExternalServiceSettings)
    
    model_config = {
        'env_file': '.env',
        'env_file_encoding': 'utf-8',
        'case_sensitive': False,
        'extra': 'ignore'
    }
    
    @field_validator('environment', mode='before')
    @classmethod
    def validate_environment(cls, v):
        allowed = ['development', 'testing', 'staging', 'production']
        if v not in allowed:
            raise ValueError(f'Environment must be one of {allowed}')
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == 'production'
    
    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.environment == 'development'
    
    @property
    def docs_url(self) -> Optional[str]:
        """API docs URL (disabled in production unless explicitly enabled)."""
        if not self.enable_swagger_docs or self.is_production:
            return None
        return "/docs"
    
    @property
    def redoc_url(self) -> Optional[str]:
        """ReDoc URL (disabled in production unless explicitly enabled)."""
        if not self.enable_swagger_docs or self.is_production:
            return None
        return "/redoc"

@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()

# Global settings instance
settings = get_settings()

# Utility functions for easy access
def get_database_url() -> str:
    """Get database URL from settings."""
    return settings.database.url

def get_async_database_url() -> str:
    """Get async database URL from settings."""
    return settings.database.async_url

def get_redis_url() -> str:
    """Get Redis URL from settings."""
    return settings.redis.url

# Compatibility layer for legacy code
class LegacySettings:
    """Compatibility wrapper for legacy settings access."""
    
    def __init__(self, settings_instance: Settings):
        self._settings = settings_instance
    
    @property
    def DATABASE_URL(self) -> str:
        return self._settings.database.url
    
    @property
    def SECRET_KEY(self) -> str:
        return self._settings.security.secret_key.get_secret_value()
    
    @property
    def DB_HOST(self) -> str:
        return self._settings.database.host
    
    @property
    def DB_PORT(self) -> int:
        return self._settings.database.port
    
    @property
    def DB_NAME(self) -> str:
        return self._settings.database.name
    
    @property
    def DB_USER(self) -> str:
        return self._settings.database.user
    
    @property
    def DB_PASSWORD(self) -> str:
        return self._settings.database.password.get_secret_value()
    
    @property
    def LOG_LEVEL(self) -> str:
        return self._settings.logging.level
    
    @property
    def LOG_FILE(self) -> Optional[str]:
        return self._settings.logging.file_path
    
    @property
    def DEBUG(self) -> bool:
        return self._settings.debug
    
    @property
    def ENVIRONMENT(self) -> str:
        return self._settings.environment
    
    # Legacy API settings
    @property
    def API_V1_STR(self) -> str:
        return self._settings.api.v1_prefix
    
    @property
    def MAX_PAGE_SIZE(self) -> int:
        return self._settings.api.max_page_size
    
    @property
    def DEFAULT_PAGE_SIZE(self) -> int:
        return self._settings.api.default_page_size
    
    # Legacy upload settings
    @property
    def MAX_UPLOAD_SIZE(self) -> int:
        return self._settings.uploads.max_size
    
    @property
    def ALLOWED_EXTENSIONS(self) -> List[str]:
        return self._settings.uploads.allowed_extensions
    
    @property
    def UPLOAD_DIR(self) -> str:
        return self._settings.uploads.storage_path
    
    # Legacy business settings
    @property
    def DEFAULT_COMMISSION_RATE(self) -> float:
        return self._settings.business.default_commission_rate
    
    @property
    def MAX_CREDIT_LIMIT(self) -> float:
        return self._settings.business.max_credit_limit
    
    @property
    def DEFAULT_CREDIT_LIMIT(self) -> float:
        return self._settings.business.default_credit_limit

# Legacy settings for backward compatibility
legacy_settings = LegacySettings(settings)

# Configuration validation (Pydantic handles this automatically now)
def validate_configuration() -> bool:
    """Validate configuration - Pydantic handles this automatically."""
    try:
        # Test critical settings
        _ = settings.database.url
        _ = settings.security.secret_key.get_secret_value()
        
        logger = logging.getLogger(__name__)
        logger.info("✅ Configuration validation successful")
        return True
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"❌ Configuration validation failed: {e}")
        return False
