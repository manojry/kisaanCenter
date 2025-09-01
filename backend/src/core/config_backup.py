"""
Enhanced Core Application Configuration.

This module provides comprehensive configuration management with:
- Environment-based configuration
- Validation and type checking
- Security settings management
- Database and external service configuration
- Logging configuration
"""
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from functools import lru_cache
from pydantic import validator, Field, SecretStr
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    host: str = Field(..., description="Database host")
    port: int = Field(5432, description="Database port")
    name: str = Field(..., description="Database name")
    user: str = Field(..., description="Database user")
    password: SecretStr = Field(..., description="Database password")
    
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
    
    secret_key: SecretStr = Field(..., description="JWT secret key")
    access_token_expire_minutes: int = Field(30)
    refresh_token_expire_days: int = Field(7)
    
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
        'env_prefix': 'SECURITY_',
        'case_sensitive': False
    }
    
    @validator('allowed_origins', mode='before')
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
    
    # External services
    webhook_secret: Optional[SecretStr] = Field(None)
    notification_service_url: Optional[str] = Field(None)
    
    # Configuration sub-sections
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    logging: LoggingSettings = Field(default_factory=LoggingSettings)
    
    model_config = {
        'env_file': '.env',
        'env_file_encoding': 'utf-8',
        'case_sensitive': False,
        'extra': 'ignore'
    }
    
    @validator('environment', mode='before')
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
        """API docs URL (disabled in production)."""
        return None if self.is_production else "/docs"
    
    @property
    def redoc_url(self) -> Optional[str]:
        """ReDoc URL (disabled in production)."""
        return None if self.is_production else "/redoc"
    
    class Config:
        env_file = ".env"
        env_nested_delimiter = "__"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()

# Global settings instance
settings = get_settings()

# Configuration validation
def validate_required_settings():
    """Validate that all required settings are present."""
    errors = []
    
    if not settings.database.host:
        errors.append("DB_HOST is required")
    if not settings.database.name:
        errors.append("DB_NAME is required")
    if not settings.database.user:
        errors.append("DB_USER is required")
    if not settings.database.password:
        errors.append("DB_PASSWORD is required")
    if not settings.security.secret_key:
        errors.append("SECRET_KEY is required")
    
    if errors:
        raise ValueError(f"Missing required configuration: {', '.join(errors)}")
    
    return True
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    ALLOWED_METHODS: List[str] = ["*"]
    ALLOWED_HEADERS: List[str] = ["*"]
    
    # API settings
    API_V1_STR: str = "/api/v1"
    MAX_PAGE_SIZE: int = int(os.getenv("MAX_PAGE_SIZE", "100"))
    DEFAULT_PAGE_SIZE: int = int(os.getenv("DEFAULT_PAGE_SIZE", "20"))
    
    # File upload settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"]
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: str = os.getenv("LOG_FILE", "")
    
    # Business settings
    DEFAULT_COMMISSION_RATE: float = float(os.getenv("DEFAULT_COMMISSION_RATE", "0.05"))
    MAX_CREDIT_LIMIT: float = float(os.getenv("MAX_CREDIT_LIMIT", "100000.0"))
    TRANSACTION_TIMEOUT_HOURS: int = int(os.getenv("TRANSACTION_TIMEOUT_HOURS", "24"))
    
    @property
    def database_url(self) -> str:
        """Get database URL."""
        if "://" in self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def redis_url(self) -> str:
        """Get Redis URL."""
        if "://" in self.REDIS_URL:
            return self.REDIS_URL
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    def validate_required_settings(self) -> None:
        """Validate that all required settings are present."""
        required_vars = {
            "DB_HOST": self.DB_HOST,
            "DB_NAME": self.DB_NAME, 
            "DB_USER": self.DB_USER,
            "DB_PASSWORD": self.DB_PASSWORD,
            "SECRET_KEY": self.SECRET_KEY
        }
        
        missing_vars = [var for var, value in required_vars.items() if not value]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance with validation."""
    settings = Settings()
    settings.validate_required_settings()
    return settings


# Global settings instance
settings = get_settings()
