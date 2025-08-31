#!/usr/bin/env python3
"""
Database Browser - View tables and data directly in VS Code
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import json

# Load environment variables
load_dotenv()

def connect_to_db():
    """Create database connection"""
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode='prefer',
        cursor_factory=RealDictCursor
    )

def list_tables():
    """List all tables in the database"""
    print("🗄️  DATABASE TABLES")
    print("=" * 50)
    
    with connect_to_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT table_name, 
                       (SELECT COUNT(*) FROM information_schema.columns 
                        WHERE table_name = t.table_name AND table_schema = 'public') as column_count
                FROM information_schema.tables t
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            
            tables = cursor.fetchall()
            
            for i, table in enumerate(tables, 1):
                print(f"{i:2}. {table['table_name']:20} ({table['column_count']} columns)")
    
    return [table['table_name'] for table in tables]

def show_table_schema(table_name):
    """Show table structure"""
    print(f"\n📋 SCHEMA: {table_name.upper()}")
    print("-" * 50)
    
    with connect_to_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = %s AND table_schema = 'public'
                ORDER BY ordinal_position;
            """, (table_name,))
            
            columns = cursor.fetchall()
            
            print(f"{'Column':<20} {'Type':<15} {'Nullable':<10} {'Default'}")
            print("-" * 65)
            
            for col in columns:
                nullable = "YES" if col['is_nullable'] == 'YES' else "NO"
                default = str(col['column_default'])[:20] if col['column_default'] else ""
                print(f"{col['column_name']:<20} {col['data_type']:<15} {nullable:<10} {default}")

def show_table_data(table_name, limit=10):
    """Show table data"""
    print(f"\n📊 DATA: {table_name.upper()} (showing first {limit} rows)")
    print("-" * 70)
    
    with connect_to_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            total_rows = cursor.fetchone()['count']
            
            cursor.execute(f"SELECT * FROM {table_name} LIMIT %s;", (limit,))
            rows = cursor.fetchall()
            
            if not rows:
                print("No data in this table.")
                return
            
            # Get column names
            columns = list(rows[0].keys())
            
            # Print header
            header = " | ".join(f"{col[:15]:<15}" for col in columns)
            print(header)
            print("-" * len(header))
            
            # Print data
            for row in rows:
                row_data = " | ".join(f"{str(row[col])[:15]:<15}" for col in columns)
                print(row_data)
            
            print(f"\nShowing {len(rows)} of {total_rows} total rows")

def run_custom_query():
    """Run a custom SQL query"""
    print("\n💬 CUSTOM QUERY")
    print("-" * 30)
    print("Enter your SQL query (or 'back' to return):")
    
    query = input("> ").strip()
    
    if query.lower() == 'back':
        return
    
    try:
        with connect_to_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                
                if cursor.description:  # SELECT query
                    rows = cursor.fetchall()
                    if rows:
                        columns = list(rows[0].keys())
                        
                        # Print results
                        header = " | ".join(f"{col[:15]:<15}" for col in columns)
                        print(header)
                        print("-" * len(header))
                        
                        for row in rows:
                            row_data = " | ".join(f"{str(row[col])[:15]:<15}" for col in columns)
                            print(row_data)
                        
                        print(f"\n{len(rows)} rows returned")
                    else:
                        print("No results returned.")
                else:  # INSERT/UPDATE/DELETE query
                    conn.commit()
                    print(f"Query executed successfully. Rows affected: {cursor.rowcount}")
                    
    except Exception as e:
        print(f"Error: {e}")

def main():
    """Main browser function"""
    print("🌾 Market Management System - Database Browser")
    print("=" * 60)
    
    try:
        while True:
            print("\nOptions:")
            print("1. List all tables")
            print("2. View table schema")
            print("3. View table data")
            print("4. Run custom query")
            print("5. Quick overview (all tables)")
            print("0. Exit")
            
            choice = input("\nEnter your choice (0-5): ").strip()
            
            if choice == "0":
                print("Goodbye! 👋")
                break
            
            elif choice == "1":
                list_tables()
            
            elif choice == "2":
                tables = list_tables()
                table_choice = input(f"\nEnter table name or number (1-{len(tables)}): ").strip()
                
                if table_choice.isdigit() and 1 <= int(table_choice) <= len(tables):
                    table_name = tables[int(table_choice) - 1]
                elif table_choice in tables:
                    table_name = table_choice
                else:
                    print("Invalid table selection.")
                    continue
                
                show_table_schema(table_name)
            
            elif choice == "3":
                tables = list_tables()
                table_choice = input(f"\nEnter table name or number (1-{len(tables)}): ").strip()
                
                if table_choice.isdigit() and 1 <= int(table_choice) <= len(tables):
                    table_name = tables[int(table_choice) - 1]
                elif table_choice in tables:
                    table_name = table_choice
                else:
                    print("Invalid table selection.")
                    continue
                
                limit = input("Number of rows to show (default 10): ").strip()
                limit = int(limit) if limit.isdigit() else 10
                
                show_table_data(table_name, limit)
            
            elif choice == "4":
                run_custom_query()
            
            elif choice == "5":
                tables = list_tables()
                for table in tables:
                    show_table_schema(table)
                    show_table_data(table, 5)
                    print("\n" + "="*70)
            
            else:
                print("Invalid choice. Please try again.")
    
    except KeyboardInterrupt:
        print("\n\nExiting... 👋")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
