
from sqlalchemy.orm import Session
from src.models import Plan, Shop, User
from src.auth.password import hash_password
from datetime import datetime, date

def seed_initial_data(db: Session):
    """Seed database with initial data"""
    
    # Create default plans
    plans_data = [
        {
            "name": "Basic",
            "description": "Basic plan for small shops",
            "monthly_price": 999.00,
            "quarterly_price": 2799.00,
            "yearly_price": 9999.00,
            "max_farmers": 50,
            "max_buyers": 100,
            "max_transactions": 1000,
            "data_retention_months": 12,
            "features": {"basic_reports": True, "email_support": True},
            "status": "ACTIVE"
        },
        {
            "name": "Professional",
            "description": "Professional plan for medium shops",
            "monthly_price": 1999.00,
            "quarterly_price": 5399.00,
            "yearly_price": 19999.00,
            "max_farmers": 200,
            "max_buyers": 500,
            "max_transactions": 5000,
            "data_retention_months": 24,
            "features": {
                "advanced_reports": True,
                "phone_support": True,
                "api_access": True,
                "custom_branding": True
            },
            "status": "ACTIVE"
        },
        {
            "name": "Enterprise",
            "description": "Enterprise plan for large operations",
            "monthly_price": 4999.00,
            "quarterly_price": 13499.00,
            "yearly_price": 49999.00,
            "max_farmers": 1000,
            "max_buyers": 2000,
            "max_transactions": 25000,
            "data_retention_months": 60,
            "features": {
                "premium_reports": True,
                "priority_support": True,
                "api_access": True,
                "custom_branding": True,
                "dedicated_manager": True,
                "custom_integrations": True
            },
            "status": "ACTIVE"
        }
    ]
    
    for plan_data in plans_data:
        plan = Plan(**plan_data)
        db.add(plan)
    
    db.flush()  # Get plan IDs
    
    # Create demo shop
    demo_shop = Shop(
        name="Demo Market",
        address="123 Market Street, Demo City",
        contact="9876543210",
        commission_rate=5.0,
        plan_id=1,  # Basic plan
        plan_start_date=date.today(),
        status="ACTIVE"
    )
    db.add(demo_shop)
    db.flush()
    
    # Create superadmin user
    superadmin = User(
        username="superadmin",
        password_hash=hash_password("admin123"),
        role="superadmin",
        contact="1234567890",
        status="ACTIVE"
    )
    db.add(superadmin)
    
    # Create demo shop owner
    shop_owner = User(
        username="shopowner",
        password_hash=hash_password("owner123"),
        role="shop_owner",
        contact="9876543210",
        shop_id=demo_shop.id,
        status="ACTIVE"
    )
    db.add(shop_owner)
    db.flush()
    
    # Update shop owner_id
    demo_shop.owner_id = shop_owner.id
    
    # Create demo users
    demo_users = [
        {
            "username": "farmer1",
            "password_hash": hash_password("farmer123"),
            "role": "farmer",
            "contact": "1111111111",
            "shop_id": demo_shop.id,
            "status": "ACTIVE"
        },
        {
            "username": "buyer1",
            "password_hash": hash_password("buyer123"),
            "role": "buyer",
            "contact": "2222222222",
            "shop_id": demo_shop.id,
            "credit_limit": 10000.00,
            "status": "ACTIVE"
        },
        {
            "username": "employee1",
            "password_hash": hash_password("emp123"),
            "role": "employee",
            "contact": "3333333333",
            "shop_id": demo_shop.id,
            "status": "ACTIVE"
        }
    ]
    
    for user_data in demo_users:
        user = User(**user_data)
        db.add(user)
    
    db.commit()
    print("Initial data seeded successfully!")

if __name__ == "__main__":
    from src.database import SessionLocal
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
