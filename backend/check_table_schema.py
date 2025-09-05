from src.database import get_db
from sqlalchemy import text
import sys

try:
    db = next(get_db())
    
    # Check shop table schema
    result = db.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'shops'
        ORDER BY ordinal_position
    """))
    columns = result.fetchall()
    print('Shop table columns:')
    for col in columns:
        print(f'  {col.column_name}: {col.data_type}')
    
    # Also check users schema
    result = db.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
    """))
    columns = result.fetchall()
    print('\nUser table columns:')
    for col in columns:
        print(f'  {col.column_name}: {col.data_type}')
        
    db.close()
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
