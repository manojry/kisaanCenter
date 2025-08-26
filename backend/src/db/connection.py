"""
Database configuration and connection management for KisaanCenter
Implements connection pooling, SSL support, and environment-based configuration
"""

import os
import logging
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
        load_dotenv()
        
        # Environment variables with defaults
        self.DB_HOST = os.getenv("DB_HOST", "localhost")
        self.DB_PORT = os.getenv("DB_PORT", "5432")
        self.DB_NAME = os.getenv("DB_NAME", "kisaan_center")
        self.DB_USER = os.getenv("DB_USER", "kisaan_user")
        self.DB_PASSWORD = os.getenv("DB_PASSWORD", "")
        self.DB_SSL_MODE = os.getenv("DB_SSL_MODE", "prefer")
        self.ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
        
        # Connection pool settings
        self.POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
        self.MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
        self.POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))  # 1 hour
        self.POOL_PRE_PING = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"
        
        # Query timeout settings
        self.STATEMENT_TIMEOUT = os.getenv("DB_STATEMENT_TIMEOUT", "30000")  # 30 seconds
        self.LOCK_TIMEOUT = os.getenv("DB_LOCK_TIMEOUT", "10000")  # 10 seconds

    @property
    def database_url(self) -> str:
        """Generate database URL with proper SSL and timeout settings"""
        base_url = f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        
        # Add SSL parameters only
        params = [
            f"sslmode={self.DB_SSL_MODE}",
        ]
        
        if self.ENVIRONMENT == "production":
            params.extend([
                "application_name=KisaanCenter-API",
                "connect_timeout=10"
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
            
            # Engine configuration
            engine_kwargs = {
                "poolclass": QueuePool,
                "pool_size": config.POOL_SIZE,
                "max_overflow": config.MAX_OVERFLOW,
                "pool_recycle": config.POOL_RECYCLE,
                "pool_pre_ping": config.POOL_PRE_PING,
                "echo": config.ENVIRONMENT == "development",
                "echo_pool": config.ENVIRONMENT == "development",
            }
            
            self._engine = create_engine(config.database_url, **engine_kwargs)
            
            # Add event listeners for connection management
            self._setup_event_listeners()
            
            logger.info("Database engine initialized successfully")
            
        return self._engine

    def _setup_event_listeners(self):
        """Setup SQLAlchemy event listeners for better connection management"""
        
        @event.listens_for(self._engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            """Set PostgreSQL-specific connection parameters"""
            if hasattr(dbapi_connection, 'cursor'):
                cursor = dbapi_connection.cursor()
                # Set timezone
                cursor.execute("SET timezone TO 'UTC'")
                # Set statement timeout (if not already set in URL)
                cursor.execute(f"SET statement_timeout TO '{config.STATEMENT_TIMEOUT}'")
                cursor.close()

        @event.listens_for(self._engine, "checkout")
        def receive_checkout(dbapi_connection, connection_record, connection_proxy):
            """Log connection checkout in development"""
            if config.ENVIRONMENT == "development":
                logger.debug("Connection checked out from pool")

        @event.listens_for(self._engine, "checkin")
        def receive_checkin(dbapi_connection, connection_record):
            """Log connection checkin in development"""
            if config.ENVIRONMENT == "development":
                logger.debug("Connection returned to pool")

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
        """Context manager for database sessions with proper error handling"""
        session_factory = self.get_session_factory()
        session = session_factory()
        
        try:
            logger.debug("Database session created")
            yield session
            session.commit()
            logger.debug("Database session committed")
            
        except Exception as e:
            logger.error(f"Database session error: {str(e)}")
            session.rollback()
            raise
            
        finally:
            session.close()
            logger.debug("Database session closed")

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
        """Test database connectivity"""
        try:
            with self.get_db_session() as session:
                session.execute(text("SELECT 1"))
                logger.info("Database connection test successful")
                return True
                
        except Exception as e:
            logger.error(f"Database connection test failed: {str(e)}")
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
            "overflow": pool.overflow(),
            "invalid": pool.invalid()
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
