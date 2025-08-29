#!/usr/bin/env python3
"""
Quick script to check database schema for debugging connection issues
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')
DB_PORT = os.getenv('DB_PORT', '5432')

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        sslmode='require'
    )

    cursor = conn.cursor()
    
    # Check superadmin table columns
    cursor.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'superadmin' 
        ORDER BY ordinal_position;
    """)

    print('Superadmin table columns:')
    superadmin_columns = cursor.fetchall()
    for row in superadmin_columns:
        print(f'  - {row[0]} ({row[1]}, nullable: {row[2]})')

    # Check users table columns
    cursor.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
    """)

    print('\nUsers table columns:')
    users_columns = cursor.fetchall()
    for row in users_columns:
        print(f'  - {row[0]} ({row[1]}, nullable: {row[2]})')

    # Check if tables exist
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    
    print('\nAll tables in database:')
    for row in cursor.fetchall():
        print(f'  - {row[0]}')

    # Test a simple query on superadmin
    print('\nTesting superadmin table access...')
    cursor.execute("SELECT COUNT(*) FROM superadmin;")
    count = cursor.fetchone()[0]
    print(f'Superadmin records: {count}')

    # Test a simple query on users
    print('\nTesting users table access...')
    cursor.execute("SELECT COUNT(*) FROM users;")
    count = cursor.fetchone()[0]
    print(f'User records: {count}')

    cursor.close()
    conn.close()
    print('\n✅ Database schema check completed successfully')

except Exception as e:
    print(f'❌ Database schema check failed: {str(e)}')
    import traceback
    traceback.print_exc()
