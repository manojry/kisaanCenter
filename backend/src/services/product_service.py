# ProductService implementation for global products listing
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..models import Product
from ..schemas import ProductCreate, APIResponse
from typing import List, Optional

class ProductService:
	def __init__(self, db: Session):
		self.db = db

	def get_all_products(self):
		# Returns all products from the products table
		return self.db.execute('SELECT * FROM products').fetchall()
	
	def assign_products_to_shop(self, shop_id: int, product_data: ProductCreate):
		"""Create a new product for a shop"""
		try:
			# Create product with shop_id
			product_dict = product_data.dict()
			product_dict['shop_id'] = shop_id  # Ensure shop_id is set
			
			# Create Product instance
			product = Product(**product_dict)
			self.db.add(product)
			self.db.commit()
			self.db.refresh(product)
			
			return APIResponse(
				success=True,
				message="Product created successfully",
				data={
					"id": product.id,
					"name": product.name,
					"category_id": product.category_id,
					"price": float(product.price) if product.price else None,
					"shop_id": product.shop_id,
					"record_status": product.record_status
				}
			)
		except Exception as e:
			return APIResponse(
				success=False,
				message=f"Failed to create product: {str(e)}",
				data=None
			)
	
	def get_products_by_shop(self, shop_id: int):
		"""Get products available for a shop"""
		try:
			# Simplified query without LEFT JOIN to test
			query = text("""
				SELECT id, name, description, category_id, price, shop_id, record_status, created_at, updated_at
				FROM products 
				WHERE shop_id IS NULL OR shop_id = :shop_id
				ORDER BY name
			""")
			
			result = self.db.execute(query, {"shop_id": shop_id}).fetchall()
			print(f"DEBUG: Simplified product query returned {len(result)} rows for shop_id {shop_id}")
			
			products = []
			for row in result:
				print(f"DEBUG: Row data: {row}")
				product = {
					"id": row[0],
					"name": row[1] if len(row) > 1 else "Unknown",
					"description": row[2] if len(row) > 2 else None,
					"category_id": row[3] if len(row) > 3 else None,
					"price": float(row[4]) if len(row) > 4 and row[4] else None,
					"shop_id": row[5] if len(row) > 5 else None,
					"record_status": row[6] if len(row) > 6 else "active",
					"created_at": str(row[7]) if len(row) > 7 else None,
					"updated_at": str(row[8]) if len(row) > 8 else None,
					"shop_active": True  # Default since no LEFT JOIN
				}
				products.append(product)
			
			print(f"DEBUG: Final products array length: {len(products)}")
			return products
		except Exception as e:
			print(f"Error getting products for shop {shop_id}: {e}")
			return []
