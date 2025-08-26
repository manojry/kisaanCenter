from ..models import Payment
from sqlalchemy.orm import Session

def create_payment(db: Session, payment_data):
    # DB query to create payment
    pass

def get_payment(db: Session, payment_id: int):
    # DB query to get payment
    pass

def update_payment(db: Session, payment_id: int, payment_data):
    # DB query to update payment
    pass

def delete_payment(db: Session, payment_id: int):
    # DB query to delete payment
    pass
