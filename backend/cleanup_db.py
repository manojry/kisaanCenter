#!/usr/bin/env python3

import psycopg2
from src.db.connection import DatabaseConfig

def cleanup_database():
    try:
        config = DatabaseConfig()
        
        # Create direct psycopg2 connection
        conn = psycopg2.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            database=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            sslmode=config.DB_SSL_MODE
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Cleaning up existing enum types...")
        
        # List of enum types to drop
        enum_types = [
            'userrole', 'transactionstatus', 'paymentstatus', 'completionstatus', 'stockstatus',
            'transactiontype', 'creditstatus', 'paymenttype', 'farmerpaymenttype', 'commissionruletype', 
            'auditaction', 'recordstatus_old', 'recordstatus', 'billingcycle', 'subscriptionstatus', 
            'limittype', 'resetcycle', 'farmerstockmode', 'transaction_status', 'payment_status', 
            'completion_status', 'record_status', 'payment_type', 'farmer_payment_type', 'credit_status', 
            'user_role', 'transaction_type', 'stock_status', 'subscription_status', 'billing_cycle'
        ]
        
        for enum_type in enum_types:
            try:
                cursor.execute(f"DROP TYPE IF EXISTS {enum_type} CASCADE")
                print(f"Dropped enum type: {enum_type}")
            except Exception as e:
                print(f"Error dropping {enum_type}: {e}")
        
        # Also clean up any existing tables just to be safe
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table[0]
            if table_name != 'alembic_version':  # Keep alembic_version if it exists
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
                    print(f"Dropped table: {table_name}")
                except Exception as e:
                    print(f"Error dropping table {table_name}: {e}")
        
        # Drop alembic_version table to start fresh
        cursor.execute("DROP TABLE IF EXISTS alembic_version CASCADE")
        print("Dropped alembic_version table")
        
        cursor.close()
        conn.close()
        print("Database cleanup completed successfully!")
        
    except Exception as e:
        print(f"Error during database cleanup: {e}")

if __name__ == "__main__":
    cleanup_database()
