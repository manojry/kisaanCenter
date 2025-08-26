from typing import Generator
from sqlalchemy.orm import Session
from .db.connection import get_db_session

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for getting database session"""
    with get_db_session() as session:
        yield session