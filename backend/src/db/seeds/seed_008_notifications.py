
"""
Seed Script: 008 - Notifications
Purpose: Seeds sample notification records for different user types
Usage: python -m src.db.seeds.seed_008_notifications
Dependencies: All previous seed scripts
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import Notification, User, Shop, UserRole
from src.core.enums import NotificationType, NotificationStatus, RecordStatus
from datetime import datetime, timedelta

def seed_notifications():
    """Seed sample notification records"""
    print("🌱 Seeding Notifications...")
    
    try:
        with get_db_session() as db:
            # Get reference data
            farmers = db.query(User).filter_by(role=UserRole.FARMER).all()
            buyers = db.query(User).filter_by(role=UserRole.BUYER).all()
            shop_owners = db.query(User).filter_by(role=UserRole.SHOP_OWNER).all()
            admin = db.query(User).filter_by(role=UserRole.SUPERADMIN).first()
            shops = db.query(Shop).all()
            
            if not all([farmers, buyers, shop_owners, admin, shops]):
                print("  ⚠️  Missing reference data. Please run previous seed scripts first.")
                return False
            
            # Sample notifications for different scenarios
            notifications = [
                # Payment notifications for farmers
                {
                    "user": farmers[0],  # Ramesh Patel
                    "type": NotificationType.PAYMENT_RECEIVED,
                    "title": "Payment Received",
                    "message": "You have received ₹285.00 payment for your tomato sales at Green Valley Agro Center.",
                    "status": NotificationStatus.READ,
                    "created_at": datetime.utcnow() - timedelta(days=5),
                    "read_at": datetime.utcnow() - timedelta(days=4)
                },
                {
                    "user": farmers[0],  # Ramesh Patel
                    "type": NotificationType.PAYMENT_PENDING,
                    "title": "Payment Pending",
                    "message": "Your payment of ₹142.50 for potato sales is pending approval.",
                    "status": NotificationStatus.UNREAD,
                    "created_at": datetime.utcnow() - timedelta(days=2)
                },
                
                # Transaction notifications for buyers
                {
                    "user": buyers[0],  # Amit Wholesaler
                    "type": NotificationType.TRANSACTION_CREATED,
                    "title": "New Transaction",
                    "message": "Your purchase of ₹300.00 has been recorded. Please complete payment.",
                    "status": NotificationStatus.READ,
                    "created_at": datetime.utcnow() - timedelta(days=5),
                    "read_at": datetime.utcnow() - timedelta(days=5)
                },
                {
                    "user": buyers[0],  # Amit Wholesaler
                    "type": NotificationType.PAYMENT_REMINDER,
                    "title": "Payment Reminder",
                    "message": "You have an outstanding balance of ₹250.00. Please clear your dues.",
                    "status": NotificationStatus.UNREAD,
                    "created_at": datetime.utcnow() - timedelta(days=1)
                },
                
                # Commission notifications for shop owners
                {
                    "user": shop_owners[0],  # Rajesh Kumar
                    "type": NotificationType.COMMISSION_EARNED,
                    "title": "Commission Earned",
                    "message": "You earned ₹15.00 commission from recent transactions.",
                    "status": NotificationStatus.READ,
                    "created_at": datetime.utcnow() - timedelta(days=3),
                    "read_at": datetime.utcnow() - timedelta(days=2)
                },
                {
                    "user": shop_owners[0],  # Rajesh Kumar
                    "type": NotificationType.LOW_STOCK_ALERT,
                    "title": "Low Stock Alert",
                    "message": "Tomato stock is running low. Only 5kg remaining.",
                    "status": NotificationStatus.UNREAD,
                    "created_at": datetime.utcnow() - timedelta(hours=6)
                },
                
                # System notifications for admin
                {
                    "user": admin,
                    "type": NotificationType.SYSTEM_ALERT,
                    "title": "New Shop Registration",
                    "message": "A new shop 'Fresh Farm Hub' has been registered and requires approval.",
                    "status": NotificationStatus.READ,
                    "created_at": datetime.utcnow() - timedelta(days=7),
                    "read_at": datetime.utcnow() - timedelta(days=6)
                },
                {
                    "user": admin,
                    "type": NotificationType.SYSTEM_ALERT,
                    "title": "Daily Report",
                    "message": "Daily transaction report: 5 transactions, ₹1,500 total sales, ₹75 commission earned.",
                    "status": NotificationStatus.UNREAD,
                    "created_at": datetime.utcnow() - timedelta(hours=2)
                },
                
                # Additional farmer notifications
                {
                    "user": farmers[1] if len(farmers) > 1 else farmers[0],  # Sunita Devi
                    "type": NotificationType.STOCK_UPDATE,
                    "title": "Stock Updated",
                    "message": "Your onion stock has been updated. Current quantity: 50kg",
                    "status": NotificationStatus.UNREAD,
                    "created_at": datetime.utcnow() - timedelta(hours=12)
                },
                
                # Buyer credit notifications
                {
                    "user": buyers[1] if len(buyers) > 1 else buyers[0],  # Neha Retailer
                    "type": NotificationType.CREDIT_LIMIT_WARNING,
                    "title": "Credit Limit Warning",
                    "message": "You are approaching your credit limit. Current usage: 80% of ₹25,000",
                    "status": NotificationStatus.UNREAD,
                    "created_at": datetime.utcnow() - timedelta(hours=8)
                }
            ]
            
            for notif_data in notifications:
                # Check if notification already exists
                existing_notif = db.query(Notification).filter_by(
                    user_id=notif_data["user"].id,
                    title=notif_data["title"],
                    message=notif_data["message"]
                ).first()
                
                if not existing_notif:
                    notification = Notification(
                        user_id=notif_data["user"].id,
                        type=notif_data["type"],
                        title=notif_data["title"],
                        message=notif_data["message"],
                        status=notif_data["status"],
                        created_at=notif_data["created_at"],
                        read_at=notif_data.get("read_at"),
                        record_status=RecordStatus.ACTIVE
                    )
                    db.add(notification)
                    status_icon = "📖" if notif_data["status"] == NotificationStatus.READ else "📩"
                    print(f"  {status_icon} Created notification: {notif_data['user'].name} - {notif_data['title']}")
                else:
                    print(f"  🔁 Skipping existing notification: {notif_data['title']}")
            
            db.commit()
            print("✅ Notifications seeding completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error seeding notifications: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return False

if __name__ == "__main__":
    seed_notifications()
