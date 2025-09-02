# ProductService implementation for global products listing
from sqlalchemy.orm import Session

class ProductService:
	def __init__(self, db: Session):
		self.db = db

	def get_all_products(self):
		# Returns all products from the products table
		return self.db.execute('SELECT * FROM products').fetchall()
