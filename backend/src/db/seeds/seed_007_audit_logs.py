
"""
Seed Script: 007 - Audit Logs
Purpose: Seeds sample audit log entries for tracking changes
Usage: python -m src.db.seeds.seed_007_audit_logs
Dependencies: All previous seed scripts
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import AuditLog, User, Shop, Transaction, UserRole
from src.core.enums import AuditAction, RecordStatus
from datetime import datetime, timedelta
import json

def seed_audit_logs():
    """Seed sample audit log entries"""
    print("🌱 Seeding Audit Logs...")
    
    try:
        with get_db_session() as db:
            # Get reference data
            users = db.query(User).all()
            shops = db.query(Shop).all()
            transactions = db.query(Transaction).all()
            
            if not all([users, shops, transactions]):
                print("  ⚠️  Missing reference data. Please run previous seed scripts first.")
                return False
            
            admin_user = db.query(User).filter_by(role=UserRole.SUPERADMIN).first()
            shop_owner = db.query(User).filter_by(role=UserRole.SHOP_OWNER).first()
            
            # Sample audit log entries
            audit_entries = [
                {
                    "user": admin_user,
                    "action": AuditAction.CREATE,
                    "table_name": "shops",
                    "record_id": shops[0].id,
                    "description": f"Created shop: {shops[0].name}",
                    "old_values": None,
                    "new_values": {
                        "name": shops[0].name,
                        "owner_id": shops[0].owner_id,
                        "commission_rate": float(shops[0].commission_rate)
                    },
                    "timestamp": datetime.utcnow() - timedelta(days=10)
                },
                {
                    "user": shop_owner,
                    "action": AuditAction.UPDATE,
                    "table_name": "shops",
                    "record_id": shops[0].id,
                    "description": f"Updated commission rate for shop: {shops[0].name}",
                    "old_values": {"commission_rate": 4.0},
                    "new_values": {"commission_rate": float(shops[0].commission_rate)},
                    "timestamp": datetime.utcnow() - timedelta(days=5)
                },
                {
                    "user": shop_owner,
                    "action": AuditAction.CREATE,
                    "table_name": "transactions",
                    "record_id": transactions[0].id if transactions else 1,
                    "description": "Created new transaction",
                    "old_values": None,
                    "new_values": {
                        "buyer_id": transactions[0].buyer_id if transactions else 1,
                        "total_amount": float(transactions[0].total_amount) if transactions else 300.0,
                        "status": "completed"
                    },
                    "timestamp": datetime.utcnow() - timedelta(days=3)
                },
                {
                    "user": shop_owner,
                    "action": AuditAction.UPDATE,
                    "table_name": "transactions",
                    "record_id": transactions[0].id if transactions else 1,
                    "description": "Updated payment status",
                    "old_values": {"payment_status": "pending"},
                    "new_values": {"payment_status": "partially_paid"},
                    "timestamp": datetime.utcnow() - timedelta(days=2)
                },
                {
                    "user": admin_user,
                    "action": AuditAction.DELETE,
                    "table_name": "products",
                    "record_id": 999,  # Dummy deleted product
                    "description": "Deleted inactive product",
                    "old_values": {
                        "name": "Old Product",
                        "is_active": False
                    },
                    "new_values": None,
                    "timestamp": datetime.utcnow() - timedelta(days=1)
                }
            ]
            
            for entry_data in audit_entries:
                # Check if audit entry already exists
                existing_entry = db.query(AuditLog).filter_by(
                    user_id=entry_data["user"].id,
                    table_name=entry_data["table_name"],
                    record_id=entry_data["record_id"],
                    action=entry_data["action"]
                ).first()
                
                if not existing_entry:
                    audit_log = AuditLog(
                        user_id=entry_data["user"].id,
                        action=entry_data["action"],
                        table_name=entry_data["table_name"],
                        record_id=entry_data["record_id"],
                        description=entry_data["description"],
                        old_values=json.dumps(entry_data["old_values"]) if entry_data["old_values"] else None,
                        new_values=json.dumps(entry_data["new_values"]) if entry_data["new_values"] else None,
                        timestamp=entry_data["timestamp"],
                        status=RecordStatus.ACTIVE
                    )
                    db.add(audit_log)
                    print(f"  📝 Created audit log: {entry_data['description']}")
                else:
                    print(f"  🔁 Skipping existing audit log: {entry_data['description']}")
            
            db.commit()
            print("✅ Audit Logs seeding completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error seeding audit logs: {str(e)}")
        db.rollback()
        return False

if __name__ == "__main__":
    seed_audit_logs()
