"""
Simple SQLite test that creates tables and tests endpoints
"""
import os
import sqlite3
from datetime import datetime

# Set up test database
DB_FILE = "test.db"

def create_test_database():
    """Create test database with basic schema"""
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL,
            shop_id INTEGER,
            contact VARCHAR(20),
            credit_limit DECIMAL(10,2) DEFAULT 0.00,
            record_status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert test user
    cursor.execute('''
        INSERT INTO users (username, password_hash, role, contact, record_status)
        VALUES (?, ?, ?, ?, ?)
    ''', ("superadmin", "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", "superadmin", "+91-9876543210", "active"))
    
    conn.commit()
    conn.close()
    print("Test database created successfully")

def test_database():
    """Test database connection and data"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    print(f"Found {len(users)} users in database")
    for user in users:
        print(f"User: {user}")
    
    conn.close()

if __name__ == "__main__":
    print("Creating test database...")
    create_test_database()
    test_database()
    print("Database test completed!")
