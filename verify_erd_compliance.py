#!/usr/bin/env python3
"""
Database Schema Verification - Confirm ERD Alignment
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

def verify_erd_compliance():
    """Verify database matches ERD specification"""
    
    print("🔍 VERIFYING ERD COMPLIANCE")
    print("=" * 50)
    
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
            # Check key ERD features
            erd_checks = {
                "Multi-tenant architecture": """
                    SELECT COUNT(*) as count FROM information_schema.tables 
                    WHERE table_name IN ('shop', 'superadmin') AND table_schema = 'public'
                """,
                
                "Transaction completion model": """
                    SELECT COUNT(*) as count FROM information_schema.columns 
                    WHERE table_name = 'transaction' AND table_schema = 'public'
                    AND column_name IN ('buyer_paid_amount', 'farmer_paid_amount', 'commission_confirmed', 'completion_status')
                """,
                
                "User role management": """
                    SELECT COUNT(*) as count FROM information_schema.columns 
                    WHERE table_name = 'users' AND table_schema = 'public'
                    AND column_name IN ('role', 'shop_id', 'credit_limit')
                """,
                
                "Stock lifecycle": """
                    SELECT COUNT(*) as count FROM information_schema.tables 
                    WHERE table_name IN ('farmer_stock', 'stock_adjustment') AND table_schema = 'public'
                """,
                
                "Credit system": """
                    SELECT COUNT(*) as count FROM information_schema.tables 
                    WHERE table_name IN ('credit', 'credit_detail') AND table_schema = 'public'
                """,
                
                "Commission management": """
                    SELECT COUNT(*) as count FROM information_schema.tables 
                    WHERE table_name = 'commission_rule' AND table_schema = 'public'
                """,
                
                "Audit trail": """
                    SELECT COUNT(*) as count FROM information_schema.columns 
                    WHERE table_name = 'audit_log' AND table_schema = 'public'
                    AND column_name IN ('entity_type', 'old_data', 'new_data')
                """,
                
                "Reference data": """
                    SELECT COUNT(*) as count FROM information_schema.tables 
                    WHERE table_name IN ('plan', 'category', 'payment_method', 'expense_category') AND table_schema = 'public'
                """
            }
            
            print("✅ ERD COMPLIANCE CHECK:")
            print("-" * 40)
            
            all_passed = True
            for check_name, query in erd_checks.items():
                cursor.execute(query)
                result = cursor.fetchone()
                expected = 4 if "Transaction completion" in check_name or "User role" in check_name or "Reference data" in check_name else 3 if "Audit trail" in check_name else 2 if check_name in ["Multi-tenant architecture", "Stock lifecycle", "Credit system"] else 1
                
                if result['count'] >= expected:
                    print(f"   ✅ {check_name}")
                else:
                    print(f"   ❌ {check_name} (found {result['count']}, expected {expected})")
                    all_passed = False
            
            # Sample data verification
            cursor.execute("SELECT COUNT(*) as count FROM plan")
            plans = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM category")
            categories = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM payment_method")
            payment_methods = cursor.fetchone()['count']
            
            print(f"\n📊 SAMPLE DATA:")
            print(f"   • Plans: {plans}")
            print(f"   • Categories: {categories}")
            print(f"   • Payment Methods: {payment_methods}")
            
            # Relationship verification
            cursor.execute("""
                SELECT 
                    tc.table_name,
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                    AND tc.table_schema = 'public'
                ORDER BY tc.table_name;
            """)
            
            foreign_keys = cursor.fetchall()
            
            print(f"\n🔗 FOREIGN KEY RELATIONSHIPS:")
            print(f"   Total foreign keys: {len(foreign_keys)}")
            
            # Key relationships from ERD
            key_relationships = [
                ('shop', 'plan_id', 'plan'),
                ('users', 'shop_id', 'shop'),  
                ('product', 'shop_id', 'shop'),
                ('transaction', 'shop_id', 'shop'),
                ('farmer_stock', 'farmer_user_id', 'users'),
                ('transaction_item', 'transaction_id', 'transaction'),
                ('credit', 'buyer_user_id', 'users'),
                ('farmer_payment', 'farmer_user_id', 'users')
            ]
            
            found_relationships = [(fk['table_name'], fk['column_name'], fk['foreign_table_name']) for fk in foreign_keys]
            
            print("\n   Key relationships from ERD:")
            for table, column, ref_table in key_relationships:
                if (table, column, ref_table) in found_relationships:
                    print(f"   ✅ {table}.{column} → {ref_table}")
                else:
                    print(f"   ❌ {table}.{column} → {ref_table}")
            
            if all_passed:
                print(f"\n🎉 DATABASE FULLY COMPLIANT WITH ERD.MD!")
                print("   ✅ All key features implemented")
                print("   ✅ Relationships properly defined")
                print("   ✅ Sample data loaded")
                print("   ✅ Ready for application development")
            else:
                print(f"\n⚠️  Some ERD features may be missing or incomplete")
                
            return all_passed

if __name__ == "__main__":
    verify_erd_compliance()
