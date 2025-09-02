import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

print("Starting import test...")

try:
    print("1. Importing from src.models...")
    from src.models import User, Shop
    print("✓ Models imported successfully")
    
    print("2. Importing database...")
    from src.database import get_db
    print("✓ Database imported successfully")
    
    print("3. Importing API...")
    from src.api.simple_endpoints import users_router
    print("✓ API imported successfully")
    
    print("4. Importing main app...")
    from src.main import app
    print("✓ Main app imported successfully")
    
    print("All imports successful!")
    
except Exception as e:
    print(f"Error during import: {e}")
    import traceback
    traceback.print_exc()
