"""
Database initialization and table creation utilities
Handles database setup, table creation, and initial data seeding
"""

import sys
import os
import logging
from typing import Optional
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError

# Add the parent directory to Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from connection import db_manager, config
from models import Base  # Import your models

logger = logging.getLogger(__name__)

class DatabaseInitializer:
    """Database initialization and setup utilities"""
    
    def __init__(self):
        self.db_manager = db_manager

    def initialize_database(self, create_db: bool = True, create_tables: bool = True) -> bool:
        """
        Complete database initialization
        
        Args:
            create_db: Whether to create database if it doesn't exist
            create_tables: Whether to create tables
            
        Returns:
            bool: Success status
        """
        try:
            logger.info("Starting database initialization...")
            
            # Step 1: Create database if requested and doesn't exist
            if create_db:
                self.db_manager.create_database_if_not_exists()
            
            # Step 2: Initialize engine and test connection
            engine = self.db_manager.initialize_engine()
            if not self.db_manager.test_connection():
                logger.error("Failed to connect to database")
                return False
            
            # Step 3: Create tables if requested
            if create_tables:
                self.create_all_tables()
            
            # Step 4: Verify table creation
            if create_tables:
                self.verify_tables()
            
            logger.info("Database initialization completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            return False

    def create_all_tables(self) -> bool:
        """Create all tables defined in SQLAlchemy models"""
        try:
            logger.info("Creating database tables...")
            engine = self.db_manager.initialize_engine()
            
            # Create all tables
            Base.metadata.create_all(bind=engine)
            
            # Create indexes and constraints if needed
            self._create_additional_indexes()
            
            logger.info("All tables created successfully")
            return True
            
        except SQLAlchemyError as e:
            logger.error(f"Error creating tables: {str(e)}")
            return False

    def _create_additional_indexes(self):
        """Create additional indexes for performance"""
        try:
            engine = self.db_manager.initialize_engine()
            
            with engine.connect() as connection:
                # Performance indexes
                indexes = [
                    "CREATE INDEX IF NOT EXISTS idx_user_email ON user(email)",
                    "CREATE INDEX IF NOT EXISTS idx_user_phone ON user(phone)",
                    "CREATE INDEX IF NOT EXISTS idx_transaction_date ON transaction(date)",
                    "CREATE INDEX IF NOT EXISTS idx_transaction_status ON transaction(status)",
                    "CREATE INDEX IF NOT EXISTS idx_farmer_stock_product ON farmer_stock(product_id)",
                    "CREATE INDEX IF NOT EXISTS idx_farmer_stock_farmer ON farmer_stock(farmer_user_id)",
                    "CREATE INDEX IF NOT EXISTS idx_payment_date ON payment(date)",
                    "CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id)",
                    "CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at)",
                ]
                
                for index_sql in indexes:
                    try:
                        connection.execute(text(index_sql))
                        logger.debug(f"Created index: {index_sql}")
                    except Exception as e:
                        logger.warning(f"Could not create index {index_sql}: {str(e)}")
                
                connection.commit()
                
        except Exception as e:
            logger.warning(f"Error creating additional indexes: {str(e)}")

    def verify_tables(self) -> bool:
        """Verify that all expected tables exist"""
        try:
            engine = self.db_manager.initialize_engine()
            inspector = inspect(engine)
            existing_tables = set(inspector.get_table_names())
            
            # Expected tables from your models
            expected_tables = {
                'user', 'shop', 'product', 'farmer_stock', 'transaction',
                'credit', 'credit_detail', 'payment', 'farmer_payment',
                'category', 'plan', 'payment_method', 'audit_log'
            }
            
            missing_tables = expected_tables - existing_tables
            if missing_tables:
                logger.error(f"Missing tables: {missing_tables}")
                return False
            
            logger.info(f"All {len(expected_tables)} tables verified successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying tables: {str(e)}")
            return False

    def drop_all_tables(self, confirm: bool = False) -> bool:
        """
        Drop all tables (USE WITH CAUTION)
        
        Args:
            confirm: Must be True to actually drop tables
        """
        if not confirm:
            logger.warning("drop_all_tables called without confirmation")
            return False
            
        try:
            logger.warning("DROPPING ALL TABLES...")
            engine = self.db_manager.initialize_engine()
            
            Base.metadata.drop_all(bind=engine)
            
            logger.warning("All tables dropped")
            return True
            
        except SQLAlchemyError as e:
            logger.error(f"Error dropping tables: {str(e)}")
            return False

    def reset_database(self, confirm: bool = False) -> bool:
        """
        Complete database reset - drops and recreates everything
        
        Args:
            confirm: Must be True to actually reset
        """
        if not confirm:
            logger.warning("reset_database called without confirmation")
            return False
            
        try:
            logger.warning("RESETTING DATABASE...")
            
            # Drop all tables
            if not self.drop_all_tables(confirm=True):
                return False
                
            # Recreate all tables
            if not self.create_all_tables():
                return False
                
            logger.info("Database reset completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database reset failed: {str(e)}")
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
            return {"error": str(e)}

# Global initializer instance
db_initializer = DatabaseInitializer()

# Convenience functions
def initialize_database(**kwargs) -> bool:
    """Initialize database with default settings"""
    return db_initializer.initialize_database(**kwargs)

def create_tables() -> bool:
    """Create all database tables"""
    return db_initializer.create_all_tables()

def verify_database() -> bool:
    """Verify database setup"""
    return db_initializer.verify_tables()

def reset_database(confirm: bool = False) -> bool:
    """Reset entire database (USE WITH CAUTION)"""
    return db_initializer.reset_database(confirm=confirm)

if __name__ == "__main__":
    """Main execution block for database initialization"""
    print("🚀 Starting KisaanCenter Database Initialization...")
    
    try:
        # Initialize the database
        success = initialize_database()
        
        if success:
            print("✅ Database initialization completed successfully!")
            print("\n📊 Database Status:")
            
            # Verify tables
            if verify_database():
                print("✅ All tables created and verified")
                
                # Show table summary
                with db_manager.get_db_session() as session:
                    inspector = inspect(session.bind)
                    tables = inspector.get_table_names()
                    print(f"📋 Created {len(tables)} tables:")
                    for table in sorted(tables):
                        print(f"   • {table}")
                        
                print(f"\n🔗 Database URL: {config.database_url}")
                print("💾 Ready for data seeding!")
                
            else:
                print("❌ Table verification failed")
                
        else:
            print("❌ Database initialization failed")
            
    except Exception as e:
        print(f"💥 Error during database initialization: {e}")
        import traceback
        traceback.print_exc()

def get_database_info() -> dict:
    """Get database information"""
    return db_initializer.get_database_info()
