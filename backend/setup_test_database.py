"""
Database Setup Script for Real API Testing
Creates all required tables and inserts test data
"""
import sqlite3
import hashlib
from datetime import datetime

DB_PATH = "test.db"

def hash_password(password):
    """Simple password hashing for testing"""
    return hashlib.sha256(password.encode()).hexdigest()

def setup_database():
    """Setup complete database schema and test data"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🔧 Setting up test database...")
    
    # 1. Create superadmin table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS superadmin (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT NOT NULL,
            contact TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert superadmin
    cursor.execute("""
        INSERT OR REPLACE INTO superadmin (id, username, password_hash, email, contact, status) 
        VALUES (1, 'superadmin', ?, 'superadmin@test.com', '1234567890', 'active')
    """, (hash_password('admin123'),))
    
    # 2. Create categories table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert categories
    categories = [
        (1, 'Vegetables', 'Fresh vegetables'),
        (2, 'Fruits', 'Fresh fruits'),
        (3, 'Grains', 'Cereals and grains'),
        (4, 'Test Category', 'For testing purposes')
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO categories (id, name, description) 
        VALUES (?, ?, ?)
    """, categories)
    
    # 3. Create shops table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shops (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            location TEXT,
            contact TEXT,
            commission_rate DECIMAL(5,2) DEFAULT 0.00,
            owner_user_id INTEGER,
            plan_id INTEGER,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert test shops
    shops = [
        (1, 'Test Shop', 'Test Address', 'Test Location', '+91-9999999999', 5.0, None, 1, 'active'),
        (2, 'Main Market', 'Main Address', 'City Center', '+91-9999999998', 4.5, None, 1, 'active')
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO shops 
        (id, name, address, location, contact, commission_rate, owner_user_id, plan_id, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, shops)
    
    # 4. Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            contact TEXT,
            shop_id INTEGER,
            credit_limit DECIMAL(12,2) DEFAULT 0.00,
            status TEXT DEFAULT 'active',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    """)
    
    # Insert test users
    users = [
        (1, 'owner1', hash_password('password'), 'owner', '+91-9876543210', 1, 0.0, 'active', 1),
        (2, 'test_farmer', hash_password('testpass'), 'farmer', '+91-9876543211', 1, 10000.0, 'active', 1),
        (3, 'test_buyer', hash_password('testpass'), 'buyer', '+91-9876543212', 1, 15000.0, 'active', 1),
        (4, 'farmer1', hash_password('password'), 'farmer', '+91-9876543213', 1, 8000.0, 'active', 1),
        (5, 'buyer1', hash_password('password'), 'buyer', '+91-9876543214', 1, 12000.0, 'active', 1),
        (6, 'reddy', hash_password('testpass'), 'farmer', '+91-9876543215', 1, 5000.0, 'active', 1)
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO users 
        (id, username, password_hash, role, contact, shop_id, credit_limit, status, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, users)
    
    # 5. Create products table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category_id INTEGER NOT NULL,
            price DECIMAL(10,2),
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)
    
    # Insert test products
    products = [
        (1, 'Test Product', 'Product for testing', 4, 100.0, 'active'),
        (2, 'Tomatoes', 'Fresh tomatoes', 1, 50.0, 'active'),
        (3, 'Apples', 'Fresh apples', 2, 80.0, 'active'),
        (4, 'Rice', 'Basmati rice', 3, 120.0, 'active')
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO products 
        (id, name, description, category_id, price, status) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, products)
    
    # 6. Create farmer_stock table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS farmer_stock (
            id INTEGER PRIMARY KEY,
            farmer_user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000,
            price DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'in_stock',
            record_status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (farmer_user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)
    
    # Insert farmer stock
    farmer_stocks = [
        (1, 2, 1, 50.0, 95.0, 'in_stock', 'active'),  # test_farmer has Test Product
        (2, 2, 2, 100.0, 45.0, 'in_stock', 'active'), # test_farmer has Tomatoes
        (3, 4, 3, 75.0, 75.0, 'in_stock', 'active'),  # farmer1 has Apples
        (4, 6, 4, 200.0, 115.0, 'in_stock', 'active') # reddy has Rice
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO farmer_stock 
        (id, farmer_user_id, product_id, quantity, price, status, record_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, farmer_stocks)
    
    # 7. Create payment_methods table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert payment methods
    payment_methods = [
        (1, 'Cash', 'Cash payment', 1, 'active'),
        (2, 'Card', 'Credit/Debit card payment', 1, 'active'),
        (3, 'UPI', 'UPI payment', 1, 'active'),
        (4, 'Bank Transfer', 'Bank transfer payment', 1, 'active')
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO payment_methods 
        (id, name, description, is_active, status) 
        VALUES (?, ?, ?, ?, ?)
    """, payment_methods)
    
    # 8. Create plans table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS plans (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            monthly_price DECIMAL(10,2) NOT NULL,
            quarterly_price DECIMAL(10,2),
            yearly_price DECIMAL(10,2),
            max_farmers INTEGER NOT NULL,
            max_buyers INTEGER NOT NULL,
            max_transactions INTEGER NOT NULL,
            data_retention_months INTEGER NOT NULL,
            features TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert plans
    plans = [
        (1, 'Basic Plan', 'Basic subscription plan', 999.00, 2700.00, 9999.00, 50, 100, 1000, 12, '{"basic_features": true}', 'active'),
        (2, 'Premium Plan', 'Premium subscription plan', 1999.00, 5400.00, 19999.00, 200, 500, 5000, 24, '{"premium_features": true}', 'active')
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO plans 
        (id, name, description, monthly_price, quarterly_price, yearly_price, max_farmers, max_buyers, max_transactions, data_retention_months, features, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, plans)
    
    # 9. Create transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY,
            shop_id INTEGER NOT NULL,
            buyer_id INTEGER NOT NULL,
            parent_transaction_id INTEGER,
            type TEXT NOT NULL DEFAULT 'sale',
            status TEXT NOT NULL DEFAULT 'pending',
            commission_rate DECIMAL(5,2) DEFAULT 0.00,
            commission_amount DECIMAL(12,2) DEFAULT 0.00,
            payment_status TEXT NOT NULL DEFAULT 'unpaid',
            buyer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
            farmer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
            commission_confirmed BOOLEAN DEFAULT 0,
            completion_status TEXT NOT NULL DEFAULT 'pending',
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (buyer_id) REFERENCES users(id)
        )
    """)
    
    # 10. Create transaction_items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transaction_items (
            id INTEGER PRIMARY KEY,
            transaction_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            farmer_id INTEGER NOT NULL,
            farmer_stock_id INTEGER,
            quantity DECIMAL(10,3) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id),
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (farmer_id) REFERENCES users(id),
            FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id)
        )
    """)
    
    # 11. Create credits table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS credits (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            record_status TEXT NOT NULL DEFAULT 'active',
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # 12. Create payments table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY,
            transaction_id INTEGER NOT NULL,
            credit_id INTEGER,
            amount DECIMAL(12,2) NOT NULL,
            payment_method_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            date DATE NOT NULL,
            reference_number TEXT,
            notes TEXT,
            processed_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id),
            FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
        )
    """)
    
    # 13. Create subscriptions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY,
            shop_id INTEGER NOT NULL,
            plan_id INTEGER NOT NULL,
            billing_cycle TEXT NOT NULL DEFAULT 'monthly',
            auto_renew BOOLEAN DEFAULT 1,
            start_date DATE,
            end_date DATE,
            status TEXT NOT NULL DEFAULT 'active',
            payment_status TEXT NOT NULL DEFAULT 'unpaid',
            amount DECIMAL(10,2),
            discount_amount DECIMAL(10,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (plan_id) REFERENCES plans(id)
        )
    """)
    
    # Insert test subscription
    cursor.execute("""
        INSERT OR REPLACE INTO subscriptions 
        (id, shop_id, plan_id, billing_cycle, start_date, end_date, status, amount) 
        VALUES (1, 1, 1, 'monthly', date('now'), date('now', '+1 month'), 'active', 999.00)
    """)
    
    # Commit all changes
    conn.commit()
    conn.close()
    
    print("✅ Test database setup complete!")
    print("📊 Database contains:")
    print("   - 1 superadmin (username: superadmin, password: admin123)")
    print("   - 2 shops")
    print("   - 6 users (various roles)")
    print("   - 4 categories")
    print("   - 4 products")
    print("   - 4 farmer stock entries")
    print("   - 4 payment methods")
    print("   - 2 subscription plans")
    print("   - 1 active subscription")

if __name__ == "__main__":
    setup_database()