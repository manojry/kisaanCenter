from ..crud import transaction_crud
from sqlalchemy.orm import Session

class TransactionService:
    @staticmethod
    def create_transaction(db: Session, transaction_data):
        return transaction_crud.create_transaction(db, transaction_data)

    @staticmethod
    def get_transaction(db: Session, transaction_id: int):
        return transaction_crud.get_transaction(db, transaction_id)

    @staticmethod
    def update_transaction(db: Session, transaction_id: int, transaction_data):
        return transaction_crud.update_transaction(db, transaction_id, transaction_data)

    @staticmethod
    def delete_transaction(db: Session, transaction_id: int):
        return transaction_crud.delete_transaction(db, transaction_id)
