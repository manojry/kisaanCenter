#!/usr/bin/env python3

import psycopg2
from src.db.connection import DatabaseConfig

def check_schema():
    try:
        config = DatabaseConfig()
        
        conn = psycopg2.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            database=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            sslmode=config.DB_SSL_MODE
        )
        cursor = conn.cursor()
        
        # Get enum values for each type
        enum_types = ['user_role', 'record_status', 'transaction_status', 'payment_status', 'payment_type']
        for enum_type in enum_types:
            cursor.execute(f"""
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '{enum_type}')
                ORDER BY enumsortorder
            """)
            values = [row[0] for row in cursor.fetchall()]
            print(f'{enum_type}: {values}')

        # Print all tables and their columns/types
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print('\nDatabase tables and columns:')
        for table in tables:
            print(f'\n{table} columns:')
            cursor.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table}'
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
            for col in columns:
                print(f'  {col[0]}: {col[1]}')
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error checking schema: {e}")

if __name__ == "__main__":
    check_schema()
