import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from db.connection import db_manager

if db_manager.test_connection():
    print("Database connection test successful")
else:
    print("Database connection test failed")
