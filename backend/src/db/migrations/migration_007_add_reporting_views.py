
"""
Migration 007: Add Reporting Views
Purpose: Creates database views for efficient reporting
Usage: python -m src.db.migrations.migration_007_add_reporting_views
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from src.database import get_db_session
from sqlalchemy import text

def create_reporting_views():
    """Create database views for reporting"""
    print("🔧 Creating Reporting Views...")
    
    views = {
        "farmer_payment_summary_view": """
        CREATE OR REPLACE VIEW farmer_payment_summary_view AS
        SELECT 
            f.id as farmer_id,
            f.name as farmer_name,
            s.id as shop_id,
            s.name as shop_name,
            DATE_TRUNC('month', t.transaction_date) as month,
            COUNT(t.id) as total_transactions,
            SUM(ti.total_price) as total_sales_value,
            SUM(t.commission_amount) as total_commission_deducted,
            SUM(ti.total_price - (ti.total_price * t.commission_rate / 100)) as farmer_due_amount,
            SUM(t.farmer_paid_amount) as total_paid_to_farmer,
            SUM(ti.total_price - (ti.total_price * t.commission_rate / 100)) - SUM(t.farmer_paid_amount) as remaining_balance
        FROM users f
        JOIN transaction_items ti ON f.id = ti.farmer_id
        JOIN transactions t ON ti.transaction_id = t.id
        JOIN shops s ON t.shop_id = s.id
        WHERE f.role = 'farmer' AND t.record_status = 'active'
        GROUP BY f.id, f.name, s.id, s.name, DATE_TRUNC('month', t.transaction_date)
        """,
        
        "buyer_payment_summary_view": """
        CREATE OR REPLACE VIEW buyer_payment_summary_view AS
        SELECT 
            b.id as buyer_id,
            b.name as buyer_name,
            s.id as shop_id,
            s.name as shop_name,
            DATE_TRUNC('month', t.transaction_date) as month,
            COUNT(t.id) as total_transactions,
            SUM(t.total_amount) as total_purchase_value,
            SUM(t.buyer_paid_amount) as total_paid_by_buyer,
            SUM(t.total_amount) - SUM(t.buyer_paid_amount) as outstanding_balance
        FROM users b
        JOIN transactions t ON b.id = t.buyer_id
        JOIN shops s ON t.shop_id = s.id
        WHERE b.role = 'buyer' AND t.record_status = 'active'
        GROUP BY b.id, b.name, s.id, s.name, DATE_TRUNC('month', t.transaction_date)
        """,
        
        "shop_commission_summary_view": """
        CREATE OR REPLACE VIEW shop_commission_summary_view AS
        SELECT 
            s.id as shop_id,
            s.name as shop_name,
            s.owner_id,
            o.name as owner_name,
            DATE_TRUNC('month', t.transaction_date) as month,
            COUNT(t.id) as total_transactions,
            SUM(t.total_amount) as total_transaction_value,
            SUM(t.commission_amount) as total_commission_earned,
            SUM(t.commission_paid_amount) as commission_collected,
            SUM(t.commission_amount) - SUM(t.commission_paid_amount) as commission_pending,
            AVG(t.commission_rate) as avg_commission_rate
        FROM shops s
        JOIN users o ON s.owner_id = o.id
        JOIN transactions t ON s.id = t.shop_id
        WHERE t.record_status = 'active'
        GROUP BY s.id, s.name, s.owner_id, o.name, DATE_TRUNC('month', t.transaction_date)
        """,
        
        "daily_transaction_summary_view": """
        CREATE OR REPLACE VIEW daily_transaction_summary_view AS
        SELECT 
            t.transaction_date,
            s.id as shop_id,
            s.name as shop_name,
            COUNT(t.id) as transaction_count,
            COUNT(DISTINCT t.buyer_id) as unique_buyers,
            COUNT(DISTINCT ti.farmer_id) as unique_farmers,
            COUNT(DISTINCT ti.product_id) as unique_products,
            SUM(t.total_amount) as total_sales,
            SUM(t.commission_amount) as total_commission,
            SUM(t.buyer_paid_amount) as buyer_payments,
            SUM(t.farmer_paid_amount) as farmer_payments,
            SUM(t.commission_paid_amount) as commission_collected
        FROM transactions t
        JOIN shops s ON t.shop_id = s.id
        JOIN transaction_items ti ON t.id = ti.transaction_id
        WHERE t.record_status = 'active'
        GROUP BY t.transaction_date, s.id, s.name
        ORDER BY t.transaction_date DESC
        """
    }
    
    try:
        with get_db_session() as db:
            for view_name, view_sql in views.items():
                print(f"  📊 Creating view: {view_name}")
                db.execute(text(view_sql))
                print(f"  ✅ View created: {view_name}")
            
            db.commit()
            print("✅ All reporting views created successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error creating reporting views: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_reporting_views()
    sys.exit(0 if success else 1)
