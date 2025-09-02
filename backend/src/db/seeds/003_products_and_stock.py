
"""
Seed Script: 003 - Products and Stock
Purpose: Seeds sample products and farmer stock data
Usage: python -m src.db.seeds.003_products_and_stock
Dependencies: 001_basic_reference_data.py, 002_sample_users_and_shops.py
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import Product, FarmerStock, User, Shop, Category, Unit, UserRole
from src.core.enums import FarmerStockMode, RecordStatus
from datetime import datetime, date
from decimal import Decimal

def seed_products_and_stock():
    """Seed sample products and farmer stock"""
    print("🌱 Seeding Products and Stock...")
    
    try:
        with get_db_session() as db:
            # Get reference data
            vegetables_cat = db.query(Category).filter_by(name="Vegetables").first()
            fruits_cat = db.query(Category).filter_by(name="Fruits").first()
            grains_cat = db.query(Category).filter_by(name="Grains").first()
            
            kg_unit = db.query(Unit).filter_by(name="kg").first()
            piece_unit = db.query(Unit).filter_by(name="piece").first()
            
            # Create Sample Products
            products = [
                {
                    "name": "Tomato",
                    "category_id": vegetables_cat.id,
                    "unit_id": kg_unit.id,
                    "description": "Fresh red tomatoes",
                    "is_active": True
                },
                {
                    "name": "Onion",
                    "category_id": vegetables_cat.id,
                    "unit_id": kg_unit.id,
                    "description": "Fresh onions",
                    "is_active": True
                },
                {
                    "name": "Potato",
                    "category_id": vegetables_cat.id,
                    "unit_id": kg_unit.id,
                    "description": "Fresh potatoes",
                    "is_active": True
                },
                {
                    "name": "Apple",
                    "category_id": fruits_cat.id,
                    "unit_id": kg_unit.id,
                    "description": "Fresh apples",
                    "is_active": True
                },
                {
                    "name": "Banana",
                    "category_id": fruits_cat.id,
                    "unit_id": piece_unit.id,
                    "description": "Fresh bananas",
                    "is_active": True
                },
                {
                    "name": "Rice",
                    "category_id": grains_cat.id,
                    "unit_id": kg_unit.id,
                    "description": "Basmati rice",
                    "is_active": True
                }
            ]
            
            created_products = []
            for product_data in products:
                existing = db.query(Product).filter_by(name=product_data["name"]).first()
                if not existing:
                    product = Product(**product_data)
                    db.add(product)
                    db.flush()
                    created_products.append(product)
                    print(f"  ✅ Created product: {product_data['name']}")
                else:
                    created_products.append(existing)
                    print(f"  ℹ️  Product already exists: {product_data['name']}")
            
            # Get farmers and shops for stock creation
            farmers = db.query(User).filter_by(role=UserRole.FARMER).all()
            shops = db.query(Shop).all()
            
            if not farmers or not shops:
                print("  ⚠️  No farmers or shops found. Skipping stock creation.")
                return
            
            # Create Sample Farmer Stock
            stock_data = [
                {
                    "farmer": farmers[0],  # Ramesh Patel
                    "product": created_products[0],  # Tomato
                    "shop": shops[0],  # Green Valley
                    "declared_qty": Decimal("100.0"),
                    "sold_qty": Decimal("25.0"),
                    "unit_price": Decimal("30.0")
                },
                {
                    "farmer": farmers[0],  # Ramesh Patel
                    "product": created_products[1],  # Onion
                    "shop": shops[0],  # Green Valley
                    "declared_qty": Decimal("80.0"),
                    "sold_qty": Decimal("15.0"),
                    "unit_price": Decimal("25.0")
                },
                {
                    "farmer": farmers[1] if len(farmers) > 1 else farmers[0],  # Sunita Devi
                    "product": created_products[2],  # Potato
                    "shop": shops[0],  # Green Valley
                    "declared_qty": Decimal("150.0"),
                    "sold_qty": Decimal("40.0"),
                    "unit_price": Decimal("20.0")
                },
                {
                    "farmer": farmers[1] if len(farmers) > 1 else farmers[0],  # Sunita Devi
                    "product": created_products[3],  # Apple
                    "shop": shops[1] if len(shops) > 1 else shops[0],  # Fresh Farm Hub
                    "declared_qty": Decimal("60.0"),
                    "sold_qty": Decimal("10.0"),
                    "unit_price": Decimal("80.0")
                }
            ]
            
            for stock_info in stock_data:
                # Check if stock already exists
                existing_stock = db.query(FarmerStock).filter_by(
                    farmer_user_id=stock_info["farmer"].id,
                    product_id=stock_info["product"].id,
                    shop_id=stock_info["shop"].id,
                    entry_date=date.today()
                ).first()
                
                if not existing_stock:
                    farmer_stock = FarmerStock(
                        farmer_user_id=stock_info["farmer"].id,
                        product_id=stock_info["product"].id,
                        shop_id=stock_info["shop"].id,
                        entry_date=date.today(),
                        declared_qty=stock_info["declared_qty"],
                        sold_qty=stock_info["sold_qty"],
                        unit_price=stock_info["unit_price"],
                        mode=FarmerStockMode.EXPLICIT,
                        declared_at=datetime.utcnow(),
                        declared_by_id=stock_info["farmer"].id,
                        carry_forward=False,
                        notes=f"Sample stock for {stock_info['product'].name}",
                        status=RecordStatus.ACTIVE
                    )
                    
                    db.add(farmer_stock)
                    print(f"  ✅ Created stock: {stock_info['farmer'].name} - {stock_info['product'].name} - {stock_info['shop'].name}")
                else:
                    print(f"  ℹ️  Stock already exists: {stock_info['farmer'].name} - {stock_info['product'].name}")
            
            db.commit()
            print("✅ Products and stock seeded successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error seeding products and stock: {str(e)}")
        return False

if __name__ == "__main__":
    success = seed_products_and_stock()
    sys.exit(0 if success else 1)
