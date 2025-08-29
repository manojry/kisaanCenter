#!/usr/bin/env python3
"""
Test database connection stability for debugging connection drops
"""

import psycopg2
import os
import time
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')
DB_PORT = os.getenv('DB_PORT', '5432')

def test_psycopg2_connection():
    """Test raw psycopg2 connection stability"""
    print("🔗 Testing psycopg2 connection stability...")
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require',
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        
        # Perform multiple queries to test stability
        for i in range(5):
            print(f"  Query {i+1}/5...")
            cursor.execute("SELECT username FROM users WHERE username = %s LIMIT 1", ('reddy',))
            result = cursor.fetchone()
            print(f"    Result: {result}")
            time.sleep(1)
        
        cursor.close()
        conn.close()
        print("✅ psycopg2 connection test passed")
        return True
        
    except Exception as e:
        print(f"❌ psycopg2 connection test failed: {str(e)}")
        return False

def test_sqlalchemy_connection():
    """Test SQLAlchemy connection stability"""
    print("\n🔗 Testing SQLAlchemy connection stability...")
    
    try:
        # Create engine with similar settings to our app
        database_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
        
        engine = create_engine(
            database_url,
            pool_size=5,
            max_overflow=10,
            pool_recycle=300,  # Shorter recycle time for testing
            pool_pre_ping=True,
            echo=True  # Show SQL queries
        )
        
        SessionFactory = sessionmaker(bind=engine)
        
        # Test multiple sessions
        for i in range(5):
            print(f"  Session {i+1}/5...")
            session = SessionFactory()
            
            try:
                result = session.execute(text("SELECT username FROM users WHERE username = :username LIMIT 1"), 
                                       {"username": "reddy"})
                row = result.fetchone()
                print(f"    Result: {row}")
                
                session.commit()
                
            except Exception as e:
                print(f"    ❌ Session {i+1} failed: {str(e)}")
                session.rollback()
                raise
            finally:
                session.close()
            
            time.sleep(1)
        
        engine.dispose()
        print("✅ SQLAlchemy connection test passed")
        return True
        
    except Exception as e:
        print(f"❌ SQLAlchemy connection test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_connection_under_load():
    """Test connection under concurrent load"""
    print("\n🔗 Testing connection under concurrent access...")
    
    try:
        database_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
        
        engine = create_engine(
            database_url,
            pool_size=2,  # Small pool to test limits
            max_overflow=3,
            pool_recycle=300,
            pool_pre_ping=True
        )
        
        SessionFactory = sessionmaker(bind=engine)
        
        # Simulate multiple concurrent requests
        import threading
        
        def worker(worker_id):
            try:
                session = SessionFactory()
                print(f"    Worker {worker_id}: Session created")
                
                # Simulate the actual auth query
                result = session.execute(
                    text("SELECT username FROM users WHERE username = :username LIMIT 1"), 
                    {"username": "reddy"}
                )
                row = result.fetchone()
                print(f"    Worker {worker_id}: Query result: {row}")
                
                # Hold connection for a moment
                time.sleep(2)
                
                session.commit()
                session.close()
                print(f"    Worker {worker_id}: Completed successfully")
                
            except Exception as e:
                print(f"    ❌ Worker {worker_id} failed: {str(e)}")
        
        # Start multiple threads
        threads = []
        for i in range(6):  # More threads than pool size
            t = threading.Thread(target=worker, args=(i+1,))
            threads.append(t)
            t.start()
        
        # Wait for all threads
        for t in threads:
            t.join()
        
        engine.dispose()
        print("✅ Concurrent connection test completed")
        return True
        
    except Exception as e:
        print(f"❌ Concurrent connection test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Starting database connection stability tests...\n")
    
    # Test 1: Basic psycopg2 stability
    test1_passed = test_psycopg2_connection()
    
    # Test 2: SQLAlchemy stability
    test2_passed = test_sqlalchemy_connection()
    
    # Test 3: Connection under load
    test3_passed = test_connection_under_load()
    
    print(f"\n📊 Test Results:")
    print(f"  psycopg2 stability: {'✅' if test1_passed else '❌'}")
    print(f"  SQLAlchemy stability: {'✅' if test2_passed else '❌'}")
    print(f"  Concurrent access: {'✅' if test3_passed else '❌'}")
    
    if all([test1_passed, test2_passed, test3_passed]):
        print("\n🎉 All connection tests passed!")
    else:
        print("\n⚠️  Some connection tests failed - investigate connection stability issues")
