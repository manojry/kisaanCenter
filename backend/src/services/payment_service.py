from ..crud import payment_crud
from sqlalchemy.orm import Session

class PaymentService:
    @staticmethod
    def create_payment(db: Session, payment_data):
        return payment_crud.create_payment(db, payment_data)

    @staticmethod
    def get_payment(db: Session, payment_id: int):
        return payment_crud.get_payment(db, payment_id)

    @staticmethod
    def update_payment(db: Session, payment_id: int, payment_data):
        return payment_crud.update_payment(db, payment_id, payment_data)

    @staticmethod
    def delete_payment(db: Session, payment_id: int):
        return payment_crud.delete_payment(db, payment_id)
