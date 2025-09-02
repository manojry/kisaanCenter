
"""
Seed Script: 002 - Sample Users and Shops
Purpose: Seeds sample users (superadmin, shop owners, farmers, buyers) and shops
Usage: python -m src.db.seeds.002_sample_users_and_shops
Dependencies: 001_basic_reference_data.py
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import User, Shop, UserRole
from datetime import datetime
import bcrypt

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_sample_users_and_shops():
    """Seed sample users and shops"""
    print("🌱 Seeding Sample Users and Shops...")
    
    try:
        with get_db_session() as db:
            # Create Superadmin
            superadmin_data = {
                "name": "Super Admin",
                "email": "admin@kisaancenter.com",
                "phone": "9999999999",
                "password_hash": hash_password("admin123"),
                "role": UserRole.SUPERADMIN,
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            
            existing_admin = db.query(User).filter_by(email=superadmin_data["email"]).first()
            if not existing_admin:
                admin = User(**superadmin_data)
                db.add(admin)
                db.flush()
                print(f"  ✅ Created superadmin: {superadmin_data['email']}")
            else:
                admin = existing_admin
                print(f"  ℹ️  Superadmin already exists: {superadmin_data['email']}")
            
            # Create Sample Shop Owners
            shop_owners = [
                {
                    "name": "Rajesh Kumar",
                    "email": "rajesh@shop1.com",
                    "phone": "9876543210",
                    "password_hash": hash_password("shop123"),
                    "role": UserRole.SHOP_OWNER,
                    "is_active": True
                },
                {
                    "name": "Priya Sharma",
                    "email": "priya@shop2.com", 
                    "phone": "9876543211",
                    "password_hash": hash_password("shop123"),
                    "role": UserRole.SHOP_OWNER,
                    "is_active": True
                }
            ]
            
            created_shop_owners = []
            for owner_data in shop_owners:
                existing = db.query(User).filter_by(email=owner_data["email"]).first()
                if not existing:
                    owner = User(**owner_data)
                    db.add(owner)
                    db.flush()
                    created_shop_owners.append(owner)
                    print(f"  ✅ Created shop owner: {owner_data['email']}")
                else:
                    created_shop_owners.append(existing)
                    print(f"  ℹ️  Shop owner already exists: {owner_data['email']}")
            
            # Create Sample Shops
            shops = [
                {
                    "name": "Green Valley Agro Center",
                    "owner_id": created_shop_owners[0].id,
                    "address": "123 Market Street, Green Valley",
                    "phone": "9876543210",
                    "email": "contact@greenvalley.com",
                    "commission_rate": 5.0,
                    "is_active": True
                },
                {
                    "name": "Fresh Farm Hub",
                    "owner_id": created_shop_owners[1].id,
                    "address": "456 Farm Road, Fresh Valley",
                    "phone": "9876543211", 
                    "email": "contact@freshfarm.com",
                    "commission_rate": 4.5,
                    "is_active": True
                }
            ]
            
            created_shops = []
            for shop_data in shops:
                existing = db.query(Shop).filter_by(name=shop_data["name"]).first()
                if not existing:
                    shop = Shop(**shop_data)
                    db.add(shop)
                    db.flush()
                    created_shops.append(shop)
                    print(f"  ✅ Created shop: {shop_data['name']}")
                else:
                    created_shops.append(existing)
                    print(f"  ℹ️  Shop already exists: {shop_data['name']}")
            
            # Create Sample Farmers
            farmers = [
                {
                    "name": "Ramesh Patel",
                    "email": "ramesh@farmer.com",
                    "phone": "9876543220",
                    "password_hash": hash_password("farmer123"),
                    "role": UserRole.FARMER,
                    "is_active": True
                },
                {
                    "name": "Sunita Devi",
                    "email": "sunita@farmer.com",
                    "phone": "9876543221",
                    "password_hash": hash_password("farmer123"),
                    "role": UserRole.FARMER,
                    "is_active": True
                }
            ]
            
            for farmer_data in farmers:
                existing = db.query(User).filter_by(email=farmer_data["email"]).first()
                if not existing:
                    farmer = User(**farmer_data)
                    db.add(farmer)
                    print(f"  ✅ Created farmer: {farmer_data['email']}")
            
            # Create Sample Buyers
            buyers = [
                {
                    "name": "Amit Wholesaler",
                    "email": "amit@buyer.com",
                    "phone": "9876543230",
                    "password_hash": hash_password("buyer123"),
                    "role": UserRole.BUYER,
                    "is_active": True
                },
                {
                    "name": "Neha Retailer",
                    "email": "neha@buyer.com",
                    "phone": "9876543231",
                    "password_hash": hash_password("buyer123"),
                    "role": UserRole.BUYER,
                    "is_active": True
                }
            ]
            
            for buyer_data in buyers:
                existing = db.query(User).filter_by(email=buyer_data["email"]).first()
                if not existing:
                    buyer = User(**buyer_data)
                    db.add(buyer)
                    print(f"  ✅ Created buyer: {buyer_data['email']}")
            
            db.commit()
            print("✅ Sample users and shops seeded successfully!")
            
    except Exception as e:
        print(f"❌ Error seeding sample data: {str(e)}")
        raise

if __name__ == "__main__":
    seed_sample_users_and_shops()
