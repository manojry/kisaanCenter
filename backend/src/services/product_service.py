from ..crud import product_crud
from sqlalchemy.orm import Session

class ProductService:
    @staticmethod
    def create_product(db: Session, product_data):
        return product_crud.create_product(db, product_data)

    @staticmethod
    def get_product(db: Session, product_id: int):
        return product_crud.get_product(db, product_id)

    @staticmethod
    def update_product(db: Session, product_id: int, product_data):
        return product_crud.update_product(db, product_id, product_data)

    @staticmethod
    def delete_product(db: Session, product_id: int):
        return product_crud.delete_product(db, product_id)
