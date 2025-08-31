#!/usr/bin/env python3
"""
Fix Database Setup - Check actual schema and insert data correctly
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import hashlib
from datetime import datetime, date
import os

# Load DB config from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'postgres'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'sslmode': os.getenv('DB_SSLMODE', 'require')
}

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def fix_database():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    try:
        # Check actual superadmin table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'superadmin' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        superadmin_columns = cursor.fetchall()
        print("Superadmin table structure:", superadmin_columns)
        
        # Check plans table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'plans' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        plans_columns = cursor.fetchall()
        print("Plans table structure:", plans_columns)
        
        # Insert superadmin based on actual structure
        if any('email' in col[0] for col in superadmin_columns):
            cursor.execute("""
                INSERT INTO superadmin (username, password_hash, email, contact, status) 
                VALUES (%s, %s, %s, %s, %s) 
                ON CONFLICT (username) DO NOTHING
            """, ('superadmin', hash_password('admin123'), 'admin@kisaancenter.com', '+91-9999999999', 'active'))
        else:
            cursor.execute("""
                INSERT INTO superadmin (username, password_hash) 
                VALUES (%s, %s) 
                ON CONFLICT (username) DO NOTHING
            """, ('superadmin', hash_password('admin123')))
        
        # Insert categories
        categories = [
            ('Vegetables', 'Fresh vegetables'),
            ('Fruits', 'Fresh fruits'),
            ('Grains', 'Cereals and grains'),
            ('Test Category', 'For testing purposes')
        ]
        
        for name, desc in categories:
            cursor.execute("""
                INSERT INTO categories (name, description) 
                VALUES (%s, %s) 
                ON CONFLICT (name) DO NOTHING
            """, (name, desc))
        
        # Insert plans with proper handling
        try:
            cursor.execute("""
                INSERT INTO plans (name, description, monthly_price, max_farmers, max_buyers, max_transactions, data_retention_months, features, status, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, ('Basic Plan', 'Basic subscription plan', 999.00, 50, 100, 1000, 12, '{"basic_features": true}', 'active'))
        except psycopg2.errors.UniqueViolation:
            pass
        
        # Insert shops
        cursor.execute("""
            INSERT INTO shops (id, name, location, contact, commission_rate, plan_id) 
            VALUES (%s, %s, %s, %s, %s, %s) 
            ON CONFLICT (id) DO NOTHING
        """, (1, 'Test Shop', 'Test Location', '+91-9999999999', 5.0, 1))
        
        # Insert users
        users = [
            (1, 'owner1', hash_password('password'), 'owner', '+91-9876543210', 1, 0.0, 'active', 1),
            (2, 'test_farmer', hash_password('testpass'), 'farmer', '+91-9876543211', 1, 10000.0, 'active', 1),
            (3, 'test_buyer', hash_password('testpass'), 'buyer', '+91-9876543212', 1, 15000.0, 'active', 1),
            (4, 'farmer1', hash_password('password'), 'farmer', '+91-9876543213', 1, 8000.0, 'active', 1),
            (5, 'buyer1', hash_password('password'), 'buyer', '+91-9876543214', 1, 12000.0, 'active', 1),
            (6, 'reddy', hash_password('testpass'), 'farmer', '+91-9876543215', 1, 5000.0, 'active', 1)
        ]
        
        for user_data in users:
            try:
                cursor.execute("""
                    INSERT INTO users (id, username, password_hash, role, contact, shop_id, credit_limit, status, created_by) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, user_data)
            except psycopg2.errors.UniqueViolation:
                pass
        
        # Insert products
        products = [
            (1, 'Test Product', 'Product for testing', 4, 100.0, 'active'),
            (2, 'Tomatoes', 'Fresh tomatoes', 1, 50.0, 'active'),
            (3, 'Apples', 'Fresh apples', 2, 80.0, 'active'),
            (4, 'Rice', 'Basmati rice', 3, 120.0, 'active')
        ]
        
        for product_data in products:
            try:
                cursor.execute("""
                    INSERT INTO products (id, name, description, category_id, price, status) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, product_data)
            except psycopg2.errors.UniqueViolation:
                pass
        
        # Insert farmer stock
        farmer_stocks = [
            (1, 2, 1, 50.0, 95.0, 'in_stock', 'active'),
            (2, 2, 2, 100.0, 45.0, 'in_stock', 'active'),
            (3, 4, 3, 75.0, 75.0, 'in_stock', 'active'),
            (4, 6, 4, 200.0, 115.0, 'in_stock', 'active')
        ]
        
        for stock_data in farmer_stocks:
            try:
                cursor.execute("""
                    INSERT INTO farmer_stock (id, farmer_user_id, product_id, quantity, price, status, record_status) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, stock_data)
            except psycopg2.errors.UniqueViolation:
                pass
        
        # Insert payment methods
        payment_methods = [
            ('Cash', 'Cash payment'),
            ('Card', 'Credit/Debit card payment'),
            ('UPI', 'UPI payment'),
            ('Bank Transfer', 'Bank transfer payment')
        ]
        
        for name, desc in payment_methods:
            cursor.execute("""
                INSERT INTO payment_methods (name, description) 
                VALUES (%s, %s) 
                ON CONFLICT (name) DO NOTHING
            """, (name, desc))
        
        print("✅ Database setup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_database()