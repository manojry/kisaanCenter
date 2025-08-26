"""
DEPRECATED: This file is replaced by the new database infrastructure in db/ folder.
For new development, use:

from db.connection import get_db_session, get_db, get_engine
from db.init_db import initialize_database

Legacy imports are maintained for backward compatibility.
"""

import warnings
from db.connection import get_engine, get_session_factory, get_db_session, get_db

# Deprecated: Use db.connection module instead
warnings.warn(
    "database.py is deprecated. Use 'from db.connection import get_db_session, get_db' instead",
    DeprecationWarning,
    stacklevel=2
)

# Legacy compatibility
engine = get_engine()
SessionLocal = get_session_factory()

def get_database_session():
    """DEPRECATED: Use get_db_session() from db.connection instead"""
    warnings.warn(
        "get_database_session() is deprecated. Use get_db_session() from db.connection instead",
        DeprecationWarning,
        stacklevel=2
    )
    return get_db_session()
