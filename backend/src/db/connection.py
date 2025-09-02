"""
Database configuration and connection management for KisaanCenter
Implements connection pooling, SSL support, and environment-based configuration
"""

import os
import logging
import time
from typing import Generator, Optional
from contextlib import contextmanager
from dotenv import load_dotenv

from sqlalchemy import (
    create_engine, 
    Engine,
    MetaData,
    event,
    text
)
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.engine import Engine as SQLAlchemyEngine
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConfig:
    """Database configuration management"""
    
    def __init__(self):
        # Load environment variables from .env file
        from dotenv import load_dotenv
        dotenv_path = "c:/Users/r.kowdampalli/Documents/kisaanCenter/backend/.env"
        print(f"[DEBUG] .env loaded from: {dotenv_path}")
        load_dotenv(dotenv_path)

        # Check if DATABASE_URL is set (for SQLite testing)
        self.DATABASE_URL = os.getenv("DATABASE_URL")
        if self.DATABASE_URL:
            print(f"[DEBUG] Using DATABASE_URL: {self.DATABASE_URL}")
            self.ENVIRONMENT = os.getenv("ENVIRONMENT", "test")
            return
            
        # Environment variables - all required from environment or .env file
        self.DB_HOST = os.getenv("DB_HOST")
        self.DB_PORT = os.getenv("DB_PORT", "5432")
        self.DB_NAME = os.getenv("DB_NAME")
        self.DB_USER = os.getenv("DB_USER")
        self.DB_PASSWORD = os.getenv("DB_PASSWORD")
        print(f"[DEBUG] DB_PASSWORD used: {self.DB_PASSWORD}")
        self.DB_SSL_MODE = os.getenv("DB_SSL_MODE", "require")
        self.ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

        # Validate required environment variables
        required_vars = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

        # Connection pool settings - more conservative for stability
        self.POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))  # Reduced pool size
        self.MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))  # Reduced overflow
        self.POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "300"))  # 5 minutes - much shorter
        self.POOL_PRE_PING = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"

        # Connection timeout settings
        self.CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", "10"))  # 10 seconds
        self.COMMAND_TIMEOUT = int(os.getenv("DB_COMMAND_TIMEOUT", "30"))  # 30 seconds

        # Query timeout settings
        self.STATEMENT_TIMEOUT = os.getenv("DB_STATEMENT_TIMEOUT", "30000")  # 30 seconds
        self.LOCK_TIMEOUT = os.getenv("DB_LOCK_TIMEOUT", "10000")  # 10 seconds

    @property
    def database_url(self) -> str:
        """Generate database URL with proper SSL and timeout settings"""
        # If DATABASE_URL is set, use it directly (for SQLite testing)
        if hasattr(self, 'DATABASE_URL') and self.DATABASE_URL:
            return self.DATABASE_URL
            
        base_url = f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        
        # Add SSL and timeout parameters for all environments
        params = [
            f"sslmode={self.DB_SSL_MODE}",
            f"connect_timeout={self.CONNECT_TIMEOUT}",
            "application_name=KisaanCenter-API"
        ]
        
        # Add additional production parameters
        if self.ENVIRONMENT == "production":
            params.extend([
                "keepalives_idle=600",
                "keepalives_interval=30", 
                "keepalives_count=3"
            ])
        else:
            # Development parameters for better debugging
            params.extend([
                "keepalives_idle=300",
                "keepalives_interval=15",
                "keepalives_count=2"
            ])
            
        return f"{base_url}?{'&'.join(params)}"

    @property
    def admin_database_url(self) -> str:
        """Generate admin database URL for database creation/management"""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/postgres"

# Global configuration instance
config = DatabaseConfig()

class DatabaseManager:
    """Centralized database management class"""
    
    def __init__(self):
        self._engine: Optional[Engine] = None
        self._session_factory: Optional[sessionmaker] = None
        self._metadata = MetaData()

    def initialize_engine(self) -> Engine:
        """Initialize database engine with connection pooling and event listeners"""
        if self._engine is None:
            logger.info(f"Initializing database engine for environment: {config.ENVIRONMENT}")
            
            # Check if using SQLite
            is_sqlite = hasattr(config, 'DATABASE_URL') and config.DATABASE_URL and config.DATABASE_URL.startswith('sqlite')
            
            if is_sqlite:
                # SQLite configuration
                engine_kwargs = {
                    "echo": config.ENVIRONMENT == "development",
                    "connect_args": {"check_same_thread": False}
                }
                logger.info("Using SQLite database for testing")
            else:
                # PostgreSQL configuration
                engine_kwargs = {
                    "poolclass": QueuePool,
                    "pool_size": config.POOL_SIZE,
                    "max_overflow": config.MAX_OVERFLOW,
                    "pool_recycle": config.POOL_RECYCLE,
                    "pool_pre_ping": config.POOL_PRE_PING,
                    "pool_timeout": 20,  # Timeout when getting connection from pool
                    "pool_reset_on_return": "commit",  # Reset connection state on return
                    "echo": config.ENVIRONMENT == "development",
                    "echo_pool": config.ENVIRONMENT == "development",
                    "connect_args": {
                        "connect_timeout": config.CONNECT_TIMEOUT
                    }
                }
                logger.info("Using PostgreSQL database")
            
            self._engine = create_engine(config.database_url, **engine_kwargs)
            
            # Add event listeners only for PostgreSQL
            if not is_sqlite:
                self._setup_event_listeners()
            
            logger.info("Database engine initialized successfully")
            
        return self._engine

    def _setup_event_listeners(self):
        """Setup SQLAlchemy event listeners for better connection management"""
        
        @event.listens_for(self._engine, "connect")
        def set_postgresql_settings(dbapi_connection, connection_record):
            """Set PostgreSQL-specific connection parameters"""
            try:
                if hasattr(dbapi_connection, 'cursor'):
                    cursor = dbapi_connection.cursor()
                    # Set timezone
                    cursor.execute("SET timezone TO 'UTC'")
                    # Set statement timeout (if not already set in URL)
                    cursor.execute(f"SET statement_timeout TO '{config.STATEMENT_TIMEOUT}'")
                    # Set lock timeout
                    cursor.execute(f"SET lock_timeout TO '{config.LOCK_TIMEOUT}'")
                    # Set idle_in_transaction_session_timeout
                    cursor.execute("SET idle_in_transaction_session_timeout TO '60000'")  # 1 minute
                    cursor.close()
                    logger.debug("PostgreSQL connection settings applied")
            except Exception as e:
                logger.warning(f"Failed to set PostgreSQL connection settings: {e}")

        @event.listens_for(self._engine, "checkout")
        def receive_checkout(dbapi_connection, connection_record, connection_proxy):
            """Handle connection checkout from pool"""
            if config.ENVIRONMENT == "development":
                logger.debug("Connection checked out from pool")
            
            # Test connection validity
            try:
                cursor = dbapi_connection.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
            except Exception as e:
                logger.error(f"Invalid connection detected during checkout: {e}")
                # Let the pool handle the invalid connection
                raise

        @event.listens_for(self._engine, "checkin")
        def receive_checkin(dbapi_connection, connection_record):
            """Handle connection checkin to pool"""
            if config.ENVIRONMENT == "development":
                logger.debug("Connection returned to pool")
            
        @event.listens_for(self._engine, "invalidate")
        def receive_invalidate(dbapi_connection, connection_record, exception):
            """Handle connection invalidation"""
            logger.warning(f"Connection invalidated: {exception}")
            
        @event.listens_for(self._engine, "soft_invalidate")
        def receive_soft_invalidate(dbapi_connection, connection_record, exception):
            """Handle soft connection invalidation"""
            logger.info(f"Connection soft invalidated: {exception}")
            
        # Add disconnection handling
        @event.listens_for(self._engine.pool, "connect")
        def receive_connect(dbapi_connection, connection_record):
            """Log new connections"""
            logger.debug("New database connection established")
            
        @event.listens_for(self._engine.pool, "close")  
        def receive_close(dbapi_connection, connection_record):
            """Log connection closures"""
            logger.debug("Database connection closed")

    def get_session_factory(self) -> sessionmaker:
        """Get SQLAlchemy session factory"""
        if self._session_factory is None:
            if self._engine is None:
                self.initialize_engine()
            
            self._session_factory = sessionmaker(
                bind=self._engine,
                autocommit=False,
                autoflush=False,
                expire_on_commit=False
            )
            
        return self._session_factory

    @contextmanager
    def get_db_session(self) -> Generator[Session, None, None]:
        """Context manager for database sessions with proper error handling and retry logic"""
        session_factory = self.get_session_factory()
        session = None
        max_retries = 3
        retry_count = 0
        
        while retry_count <= max_retries:
            try:
                session = session_factory()
                logger.debug(f"Database session created (attempt {retry_count + 1})")
                
                # Test the connection before yielding
                session.execute(text("SELECT 1"))
                
                yield session
                session.commit()
                logger.debug("Database session committed successfully")
                break  # Success, exit retry loop
                
            except Exception as e:
                logger.error(f"Database session error (attempt {retry_count + 1}): {str(e)}")
                
                if session:
                    try:
                        session.rollback()
                    except:
                        pass
                    try:
                        session.close()
                        session = None
                    except:
                        pass
                
                # Check if this is a connection-related error that might benefit from retry
                error_msg = str(e).lower()
                is_connection_error = any(phrase in error_msg for phrase in [
                    "server closed the connection",
                    "connection", 
                    "timeout",
                    "disconnected",
                    "broken pipe",
                    "connection reset"
                ])
                
                if is_connection_error and retry_count < max_retries:
                    retry_count += 1
                    logger.info(f"Retrying database operation (attempt {retry_count + 1}/{max_retries + 1})")
                    time.sleep(0.1 * retry_count)  # Brief exponential backoff
                    continue
                else:
                    raise  # Re-raise the exception if not retryable or max retries reached
                    
        # Ensure session is closed in finally block
        if session:
            try:
                session.close()
                logger.debug("Database session closed")
            except Exception as close_error:
                logger.warning(f"Error closing database session: {close_error}")

    def create_database_if_not_exists(self) -> bool:
        """Create database if it doesn't exist (for initial setup)"""
        try:
            # Connect to postgres database to create our target database
            admin_engine = create_engine(config.admin_database_url)
            
            with admin_engine.connect() as connection:
                connection.execute(text("COMMIT"))  # End any existing transaction
                
                # Check if database exists
                result = connection.execute(
                    text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                    {"db_name": config.DB_NAME}
                )
                
                if not result.fetchone():
                    # Create database
                    connection.execute(text(f"CREATE DATABASE {config.DB_NAME}"))
                    logger.info(f"Database '{config.DB_NAME}' created successfully")
                    return True
                else:
                    logger.info(f"Database '{config.DB_NAME}' already exists")
                    return False
                    
        except Exception as e:
            logger.error(f"Error creating database: {str(e)}")
            raise

    def test_connection(self) -> bool:
        """Test database connectivity with better error handling"""
        max_attempts = 3
        
        for attempt in range(max_attempts):
            try:
                with self.get_db_session() as session:
                    # Test basic connectivity
                    session.execute(text("SELECT 1"))
                    
                    # Test actual table access that was failing
                    session.execute(text("SELECT COUNT(*) FROM users LIMIT 1"))
                    
                    logger.info(f"Database connection test successful (attempt {attempt + 1})")
                    return True
                    
            except Exception as e:
                logger.warning(f"Database connection test failed (attempt {attempt + 1}): {str(e)}")
                if attempt < max_attempts - 1:
                    time.sleep(0.5 * (attempt + 1))  # Exponential backoff
                else:
                    logger.error(f"Database connection test failed after {max_attempts} attempts")
                    
        return False

    def get_connection_info(self) -> dict:
        """Get current connection pool information"""
        if self._engine is None:
            return {"status": "not_initialized"}
            
        pool = self._engine.pool
        return {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow()
        }

    def close_connections(self):
        """Close all database connections (for shutdown)"""
        if self._engine:
            self._engine.dispose()
            logger.info("All database connections closed")

# Global database manager instance
db_manager = DatabaseManager()

# Convenience functions for backward compatibility
def get_engine() -> Engine:
    """Get database engine"""
    return db_manager.initialize_engine()

def get_session_factory() -> sessionmaker:
    """Get session factory"""
    return db_manager.get_session_factory()

@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Get database session context manager"""
    with db_manager.get_db_session() as session:
        yield session

# Dependency for FastAPI (if using FastAPI)
def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for getting database session"""
    with get_db_session() as session:
        yield session

# Health check function
def check_database_health() -> dict:
    """Comprehensive database health check"""
    health_status = {
        "database": "unknown",
        "connection_pool": "unknown",
        "last_check": None
    }
    
    try:
        # Test basic connectivity
        if db_manager.test_connection():
            health_status["database"] = "healthy"
        else:
            health_status["database"] = "unhealthy"
            
        # Get connection pool info
        pool_info = db_manager.get_connection_info()
        health_status["connection_pool"] = pool_info
        
        from datetime import datetime
        health_status["last_check"] = datetime.utcnow().isoformat()
        
    except Exception as e:
        health_status["database"] = "error"
        health_status["error"] = str(e)
        
    return health_status

if __name__ == "__main__":
    if db_manager.test_connection():
        print("Database connection test successful")
    else:
        print("Database connection test failed")
