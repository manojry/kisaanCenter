"""
Database manager and connection handling.

This module provides database connection management and session handling
for the Market Management System.
"""
from typing import Generator, Optional
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager

from ..db.connection import config
from .models import Base

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Database connection and session manager."""
    
    def __init__(self):
        self._engine = None
        self._sessionmaker = None
    
    def initialize_engine(self, database_url: Optional[str] = None):
        """Initialize database engine."""
        db_url = database_url or config.database_url
        
        try:
            self._engine = create_engine(
                db_url,
                pool_size=10,
                max_overflow=20,
                pool_recycle=3600,
                pool_pre_ping=True,
                echo=config.ENVIRONMENT == "development"
            )
            
            self._sessionmaker = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self._engine
            )
            
            logger.info(f"Database engine initialized: {db_url}")
            
        except Exception as e:
            logger.error(f"Failed to initialize database engine: {e}")
            raise
    
    def create_all_tables(self):
        """Create all database tables."""
        if not self._engine:
            raise RuntimeError("Database engine not initialized")
        
        try:
            Base.metadata.create_all(bind=self._engine)
            logger.info("All database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create database tables: {e}")
            raise
    
    def drop_all_tables(self):
        """Drop all database tables."""
        if not self._engine:
            raise RuntimeError("Database engine not initialized")
        
        try:
            Base.metadata.drop_all(bind=self._engine)
            logger.info("All database tables dropped successfully")
        except Exception as e:
            logger.error(f"Failed to drop database tables: {e}")
            raise
    
    def test_connection(self) -> bool:
        """Test database connection."""
        if not self._engine:
            return False
        
        try:
            with self._engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False
    
    def get_session(self) -> Session:
        """Get a new database session."""
        if not self._sessionmaker:
            raise RuntimeError("Database engine not initialized")
        
        return self._sessionmaker()
    
    @contextmanager
    def get_session_context(self):
        """Get database session with context manager."""
        session = self.get_session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    def close_connections(self):
        """Close all database connections."""
        if self._engine:
            self._engine.dispose()
            logger.info("Database connections closed")
    
    def get_connection_info(self) -> dict:
        """Get database connection information."""
        if not self._engine:
            return {"status": "not_initialized"}
        
        return {
            "status": "initialized",
            "url": str(self._engine.url).replace(self._engine.url.password or "", "***"),
            "pool_size": self._engine.pool.size(),
            "checked_in": self._engine.pool.checkedin(),
            "checked_out": self._engine.pool.checkedout(),
        }


# Global database manager instance
db_manager = DatabaseManager()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for getting database session."""
    with db_manager.get_session_context() as session:
        yield session


def init_database():
    """Initialize database with tables and seed data."""
    try:
        # Initialize engine
        db_manager.initialize_engine()
        
        # Test connection
        if not db_manager.test_connection():
            raise RuntimeError("Database connection failed")
        
        # Create tables
        db_manager.create_all_tables()
        
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
