#!/usr/bin/env python3
"""
Script to seed shops, owners, categories, assign categories to shops,
and add buyer, farmer, product, and farmer stock for both shops.
"""
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
from backend.src.models import User, Product, FarmerStock, Shop, RecordStatus, UserRole
from backend.src.models.category import Category
from backend.src.models.shop_category import ShopCategory
from backend.src.services.user_service import UserService

DB_URL = "sqlite:///test.db"
SHOP_IDS = [1, 2]
OWNER_IDS = [5, 7]

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
db = Session()

# --- 1. Seed Categories ---
category_objs = []
cat_names = ["Grains", "Vegetables", "Fruits"]
for cname in cat_names:
    cat = Category(name=cname, description=f"All types of {cname.lower()}", status=RecordStatus.ACTIVE.value, created_at=datetime.now(), updated_at=datetime.now())
    db.add(cat)
    category_objs.append(cat)
db.commit()
for cat in category_objs:
    db.refresh(cat)
print("Categories seeded:", [cat.name for cat in category_objs])

# --- 2. Assign Categories to Shops ---
for shop_id in SHOP_IDS:
    for cat in category_objs:
        shop_cat = ShopCategory(shop_id=shop_id, category_id=cat.id)
        db.add(shop_cat)
db.commit()
print(f"Categories assigned to shops {SHOP_IDS}")

# --- 3. Add Buyer, Farmer, Product, FarmerStock for each shop ---
for shop_id in SHOP_IDS:
    print(f"\nSeeding for Shop {shop_id}")
    buyer = UserService.create_user(
        db=db,
        username=f"buyer{shop_id}",
        password_hash=f"buyer{shop_id}@123",
        role=UserRole.BUYER.value,
        shop_id=shop_id,
        contact=f"+9112345678{shop_id}",
        credit_limit=1000.0,
        status=RecordStatus.ACTIVE.value,
        email=f"buyer{shop_id}@example.com",
        full_name=f"Buyer {shop_id}"
    )
    print("Buyer creation:", buyer)

    farmer = UserService.create_user(
        db=db,
        username=f"farmer{shop_id}",
        password_hash=f"farmer{shop_id}@123",
        role=UserRole.FARMER.value,
        shop_id=shop_id,
        contact=f"+9198765432{shop_id}",
        credit_limit=500.0,
        status=RecordStatus.ACTIVE.value,
        email=f"farmer{shop_id}@example.com",
        full_name=f"Farmer {shop_id}"
    )
    print("Farmer creation:", farmer)

    # Add product for each shop, assign to first category
    try:
        print(f"Attempting to create product for shop_id={shop_id}, category_id={category_objs[0].id}")
        product = Product(
            name=f"Wheat{shop_id}",
            description=f"High quality wheat for shop {shop_id}",
            category_id=category_objs[0].id,
            price=120.0 + shop_id,
            status=RecordStatus.ACTIVE.value,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        print("Product creation successful:", product)
    except Exception as e:
        db.rollback()
        print(f"Product creation failed for shop_id={shop_id}: {e}")

    # Assign FarmerStock
    farmer_user_id = getattr(farmer.data, "id", None) if hasattr(farmer, "data") else None
    if farmer_user_id:
        stock = FarmerStock(
            farmer_id=farmer_user_id,
            product_id=product.id,
            shop_id=shop_id,
            declared_qty=100.0,
            sold_qty=0.0,
            expired_qty=0.0,
            balance_qty=100.0,
            price_per_unit=product.price,
            status=RecordStatus.ACTIVE.value,
            date=datetime.now().date(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(stock)
        db.commit()
        db.refresh(stock)
        print("FarmerStock creation:", stock)
    else:
        print("Farmer user ID not found, skipping FarmerStock.")

db.close()
print("Seeding complete.")
