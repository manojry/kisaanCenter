#!/usr/bin/env python3
"""
Check database schema - list all tables and their columns
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from connection import db_manager
from sqlalchemy import inspect
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_schema():
    """Check database schema"""
    try:
        with db_manager.get_db_session() as session:
            inspector = inspect(session.bind)
            
            print("📋 Database Tables and Columns:")
            print("=" * 50)
            
            tables = inspector.get_table_names()
            for table_name in sorted(tables):
                print(f"\n🏷️ Table: {table_name}")
                columns = inspector.get_columns(table_name)
                for column in columns:
                    nullable = "NULL" if column['nullable'] else "NOT NULL"
                    default = f" DEFAULT {column['default']}" if column.get('default') else ""
                    print(f"   • {column['name']}: {column['type']} {nullable}{default}")
                    
            print("\n" + "=" * 50)
            print(f"📊 Total tables: {len(tables)}")
            
    except Exception as e:
        logger.error(f"Schema check failed: {str(e)}")

if __name__ == "__main__":
    check_schema()
