from ..crud import credit_crud
from sqlalchemy.orm import Session

class CreditService:
    @staticmethod
    def create_credit(db: Session, credit_data):
        return credit_crud.create_credit(db, credit_data)

    @staticmethod
    def get_credit(db: Session, credit_id: int):
        return credit_crud.get_credit(db, credit_id)

    @staticmethod
    def update_credit(db: Session, credit_id: int, credit_data):
        return credit_crud.update_credit(db, credit_id, credit_data)

    @staticmethod
    def delete_credit(db: Session, credit_id: int):
        return credit_crud.delete_credit(db, credit_id)
