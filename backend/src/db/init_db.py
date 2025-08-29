
"""
Database initialization and table creation utilities.

This script is intended for initial development setup, testing, or creating a fresh
database from scratch. It is NOT a replacement for production database migrations,
which should be handled by Alembic.
"""


import logging
import os
import sys
import traceback
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError

# Add the project root to Python path for consistent imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import all models to ensure they are registered with SQLAlchemy's Base metadata.
# This is crucial for `Base.metadata.create_all(engine)` to work correctly.
from src.database import models
from src.db.connection import db_manager, config

logger = logging.getLogger(__name__)

class DatabaseInitializer:
    """Handles database creation, table setup, and verification."""
    
    def __init__(self, db_manager_instance):
        self.db_manager = db_manager_instance

    def initialize_database(self, **kwargs) -> bool:
        """Initializes the database if it doesn't exist."""
        try:
            logger.info("Initializing database...")
            self.db_manager.initialize_database(**kwargs)
            logger.info("Database initialized successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            return False

    def create_all_tables(self) -> bool:
        """Creates all tables defined in the models based on SQLAlchemy metadata."""
        try:
            engine = self.db_manager.initialize_engine()
            logger.info("Creating all tables from model metadata...")
            # `models.Base.metadata` now contains all table definitions from `database/models.py`
            models.Base.metadata.create_all(bind=engine)
            
            self._create_additional_indexes()
            
            logger.info("All tables created successfully.")
            return True
        except SQLAlchemyError as e:
            logger.error(f"An error occurred during table creation: {e}")
            return False

    def _create_additional_indexes(self):
        """Create additional non-unique indexes for performance optimization."""
        logger.info("Creating additional performance indexes...")
        try:
            engine = self.db_manager.initialize_engine()
            
            with engine.connect() as connection:
                # List of idempotent index creation statements
                indexes = [
                    "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
                    "CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)",
                    "CREATE INDEX IF NOT EXISTS idx_transaction_date ON transaction(transaction_date)",
                    "CREATE INDEX IF NOT EXISTS idx_transaction_status ON transaction(status)",
                    "CREATE INDEX IF NOT EXISTS idx_farmer_stock_product ON farmer_stock(product_id)",
                    "CREATE INDEX IF NOT EXISTS idx_farmer_stock_farmer ON farmer_stock(farmer_user_id)",
                    "CREATE INDEX IF NOT EXISTS idx_payment_date ON payment(payment_date)",
                    "CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id)",
                    "CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at)",
                ]
                
                for index_sql in indexes:
                    try:
                        connection.execute(text(index_sql))
                        logger.debug(f"Ensured index exists: {index_sql.split(' ')[5]}")
                    except Exception as e:
                        # Log as a warning because it's not a critical failure
                        logger.warning(f"Could not create index '{index_sql}': {str(e)}")
                
                # Use commit to finalize the transaction
                connection.commit()
                logger.info("Finished creating additional indexes.")
                
        except Exception as e:
            logger.warning(f"An error occurred while creating additional indexes: {str(e)}", exc_info=True)

    def verify_tables(self) -> bool:
        """Verifies that all expected tables have been created in the database."""
        try:
            engine = self.db_manager.initialize_engine()
            inspector = inspect(engine)
            db_tables = inspector.get_table_names()
            model_tables = models.Base.metadata.tables.keys()
            
            missing_tables = [table for table in model_tables if table not in db_tables]
            
            if not missing_tables:
                logger.info(f"Database verification successful. Found {len(db_tables)} tables.")
                return True
            else:
                logger.error(f"Database verification failed. Missing tables: {missing_tables}")
                return False
        except SQLAlchemyError as e:
            logger.error(f"An error occurred during table verification: {e}")
            return False

    def reset_database(self, confirm: bool = False) -> bool:
        """Drops all tables and recreates them. Requires confirmation."""
        if not confirm:
            logger.warning("Database reset aborted. Confirmation not provided.")
            return False
        
        try:
            engine = self.db_manager.initialize_engine()
            logger.warning("Dropping all tables...")
            models.Base.metadata.drop_all(bind=engine)
            logger.info("All tables dropped.")
            return self.create_all_tables()
        except SQLAlchemyError as e:
            logger.error(f"An error occurred during database reset: {e}")
            return False

    def get_database_info(self) -> dict:
        """Get comprehensive database information"""
        try:
            engine = self.db_manager.initialize_engine()
            inspector = inspect(engine)
            
            tables = inspector.get_table_names()
            table_info = {}
            
            for table in tables:
                columns = inspector.get_columns(table)
                indexes = inspector.get_indexes(table)
                foreign_keys = inspector.get_foreign_keys(table)
                
                table_info[table] = {
                    "columns": len(columns),
                    "indexes": len(indexes),
                    "foreign_keys": len(foreign_keys),
                    "column_details": [
                        {
                            "name": col["name"],
                            "type": str(col["type"]),
                            "nullable": col["nullable"],
                            "primary_key": col.get("primary_key", False)
                        }
                        for col in columns
                    ]
                }
            
            return {
                "database_name": config.DB_NAME,
                "total_tables": len(tables),
                "tables": table_info,
                "connection_info": self.db_manager.get_connection_info()
            }
        
        except Exception as e:
            logger.error(f"Error getting database info: {str(e)}")
            traceback.print_exc()
            return {"error": str(e)}

# Global initializer instance for convenience in scripting
db_initializer = DatabaseInitializer(db_manager)

# Convenience functions for direct script execution
def initialize_database(**kwargs) -> bool:
    """Convenience wrapper for DatabaseInitializer.initialize_database."""
    return db_initializer.initialize_database(**kwargs)

def create_tables() -> bool:
    """Convenience wrapper for DatabaseInitializer.create_all_tables."""
    return db_initializer.create_all_tables()

def verify_database() -> bool:
    """Convenience wrapper for DatabaseInitializer.verify_tables."""
    return db_initializer.verify_tables()

def reset_database(confirm: bool = False) -> bool:
    """Convenience wrapper for DatabaseInitializer.reset_database."""
    return db_initializer.reset_database(confirm=confirm)

def get_database_info() -> dict:
    """Convenience wrapper for DatabaseInitializer.get_database_info."""
    return db_initializer.get_database_info()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logger.info("Running Database Initializer script...")
    
    try:
        # This script is a command-line utility for database management.
        # Example of how to use the script directly.
        # Uncomment the desired action or pass command-line arguments.
        
        # 1. Initialize the database (creates it if not exists)
        # initialize_database()
        
        # 2. Create all tables
        if create_tables():
            logger.info("SCRIPT: Table creation process completed successfully.")
        else:
            logger.error("SCRIPT: Table creation process failed.")
            sys.exit(1)

        # 3. Verify tables
        verify_database()

        # 4. Get database info
        # import json
        # info = get_database_info()
        # print(json.dumps(info, indent=2))

        # 5. Reset the database (DANGEROUS: DROPS ALL DATA)
        # confirmation = input("Are you sure you want to reset the database? This will delete all data. (yes/no): ")
        # if confirmation.lower() == 'yes':
        #     if reset_database(confirm=True):
        #         logger.info("SCRIPT: Database reset completed successfully.")
        #     else:
        #         logger.error("SCRIPT: Database reset failed.")
        # else:
        #     logger.info("SCRIPT: Database reset aborted by user.")

    except Exception as e:
        logger.critical(f"A critical error occurred in the main script execution: {e}")
        traceback.print_exc()
        sys.exit(1)
