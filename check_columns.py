import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend', 'src'))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Database connection from .env
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}?sslmode=require"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check shop table columns
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'shop' ORDER BY column_name"))
    shop_columns = [r[0] for r in result]
    print("Shop table columns:")
    for col in shop_columns:
        print(f"  - {col}")
    
    # Check plan table columns  
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'plan' ORDER BY column_name"))
    plan_columns = [r[0] for r in result]
    print("\nPlan table columns:")
    for col in plan_columns:
        print(f"  - {col}")
    
    # Check enum values for recordstatus
    result = conn.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'recordstatus') ORDER BY enumsortorder"))
    enum_values = [r[0] for r in result]
    print(f"\nRecordStatus enum values in database:")
    for val in enum_values:
        print(f"  - {val}")

engine.dispose()
