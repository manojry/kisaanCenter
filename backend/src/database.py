

from typing import Generator
from sqlalchemy.orm import Session
from .db.connection import get_db_session, DatabaseManager
from .models import Base

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for getting database session"""
    with get_db_session() as session:
        yield session

# Export a singleton db_manager for use in main.py and tests
db_manager = DatabaseManager()

# Export Base for test and app imports
Base = Base