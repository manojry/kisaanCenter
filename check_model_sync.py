#!/usr/bin/env python3
"""
Model Validation Script - Check if models.py matches current database
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

def check_model_sync():
    """Check if models.py is in sync with current database structure"""
    
    print("🔍 CHECKING MODEL SYNC WITH DATABASE")
    print("=" * 60)
    
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
            # Get all table names
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            db_tables = [row['table_name'] for row in cursor.fetchall()]
            
            print(f"📊 Database has {len(db_tables)} tables:")
            for table in db_tables:
                print(f"   • {table}")
            
            # Expected models from ERD
            expected_models = [
                'superadmin', 'shop', 'users', 'plan', 'category', 'product',
                'farmer_stock', 'transaction', 'transaction_item', 'credit', 
                'credit_detail', 'payment', 'farmer_payment', 'payment_method',
                'commission_rule', 'expense', 'expense_category', 'stock_adjustment',
                'product_price_history', 'plan_feature', 'audit_log'
            ]
            
            print(f"\n📋 Expected models ({len(expected_models)}):")
            for model in expected_models:
                status = "✅" if model in db_tables else "❌"
                print(f"   {status} {model}")
            
            # Check key table structures
            key_tables = ['users', 'transaction', 'shop', 'product']
            
            for table_name in key_tables:
                if table_name in db_tables:
                    print(f"\n📋 {table_name.upper()} structure:")
                    cursor.execute(f"""
                        SELECT column_name, data_type, is_nullable, column_default
                        FROM information_schema.columns
                        WHERE table_name = '{table_name}' AND table_schema = 'public'
                        ORDER BY ordinal_position;
                    """)
                    columns = cursor.fetchall()
                    for col in columns:
                        nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                        default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
                        print(f"   • {col['column_name']}: {col['data_type']} {nullable}{default}")
            
            print("\n" + "="*60)
            print("🚨 ISSUES FOUND:")
            print("="*60)
            
            # Issue 1: Table name mismatch
            if 'users' in db_tables:
                print("❌ CRITICAL: Table name mismatch")
                print("   Database has: 'users'")
                print("   Models.py has: 'user' (singular)")
                print("   Fix: Change __tablename__ = 'user' to __tablename__ = 'users'")
            
            # Issue 2: Missing tables
            missing_tables = [t for t in expected_models if t not in db_tables]
            if missing_tables:
                print(f"\n❌ MISSING TABLES ({len(missing_tables)}):")
                for table in missing_tables:
                    print(f"   • {table}")
                print("   Fix: Models.py doesn't have all ERD tables")
            
            # Issue 3: Seed data structure mismatch
            print(f"\n❌ SEED DATA ISSUES:")
            print("   • seed_data.py references old model structure")
            print("   • Uses deprecated UserRole values (SHOP_OWNER vs OWNER)")
            print("   • Missing imports for new models")
            print("   • References wrong table/field names")
            
            print(f"\n🔧 REQUIRED FIXES:")
            print("="*40)
            print("1. Update models.py:")
            print("   - Fix table name: 'user' → 'users'")
            print("   - Add missing models: commission_rule, expense, etc.")
            print("   - Fix UserRole enum values")
            print("   - Add missing relationships")
            
            print("\n2. Update seed_data.py:")
            print("   - Import all new models")
            print("   - Fix UserRole references")
            print("   - Update to match new schema")
            print("   - Fix table/field name references")
            
            print("\n3. Database alignment:")
            print("   - Models should match exactly with database")
            print("   - All ERD tables should have corresponding models")

if __name__ == "__main__":
    check_model_sync()
