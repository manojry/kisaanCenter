#!/usr/bin/env python3
"""
Quick Database Overview - Shows all tables and sample data
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

def show_database_overview():
    """Show complete database overview"""
    print("🌾 MARKET MANAGEMENT SYSTEM - DATABASE OVERVIEW")
    print("=" * 70)
    
    with psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode='prefer',
        cursor_factory=RealDictCursor
    ) as conn:
        
        with conn.cursor() as cursor:
            # Get all tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = [row['table_name'] for row in cursor.fetchall()]
            
            for table_name in tables:
                print(f"\n📋 TABLE: {table_name.upper()}")
                print("-" * 50)
                
                # Get table info
                cursor.execute("SELECT COUNT(*) as count FROM " + table_name)
                row_count = cursor.fetchone()['count']
                
                # Get columns
                cursor.execute("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns
                    WHERE table_name = %s AND table_schema = 'public'
                    ORDER BY ordinal_position;
                """, (table_name,))
                columns = cursor.fetchall()
                
                print(f"Rows: {row_count}")
                print(f"Columns: {', '.join([col['column_name'] for col in columns])}")
                
                # Show sample data
                if row_count > 0:
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                    sample_rows = cursor.fetchall()
                    
                    if sample_rows:
                        print("\nSample Data:")
                        for i, row in enumerate(sample_rows, 1):
                            print(f"  Row {i}: {dict(row)}")
                
                print("-" * 50)

if __name__ == "__main__":
    show_database_overview()
