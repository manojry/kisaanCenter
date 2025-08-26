"""
Alembic migration configuration
Provides database schema versioning and migration management
"""

import os
import sys
import logging
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool
from alembic import context

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import your models and database configuration
from models import Base  # Your SQLAlchemy models
from db.connection import config as db_config

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

logger = logging.getLogger('alembic.env')

# Set the SQLAlchemy URL from our database configuration
config.set_main_option('sqlalchemy.url', db_config.database_url)

# Add your model's MetaData object for 'autogenerate' support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    
    This configures the context with just a URL and not an Engine.
    By skipping the Engine creation we don't even need a DBAPI to be available.
    Calls to context.execute() here emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    
    In this scenario we need to create an Engine and associate a connection 
    with the context.
    """
    # Create engine with connection pooling disabled for migrations
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = db_config.database_url
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            # Include schemas in migrations if using multiple schemas
            include_schemas=True,
            # Custom compare functions for better migration detection
            render_as_batch=True,  # For SQLite compatibility if needed
        )

        with context.begin_transaction():
            context.run_migrations()

# Determine which mode to run
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
