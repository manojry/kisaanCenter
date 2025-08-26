from ..models import Product
from sqlalchemy.orm import Session

def create_product(db: Session, product_data):
    # DB query to create product
    pass

def get_product(db: Session, product_id: int):
    # DB query to get product
    pass

def update_product(db: Session, product_id: int, product_data):
    # DB query to update product
    pass

def delete_product(db: Session, product_id: int):
    # DB query to delete product
    pass
