from ..models import Transaction
from sqlalchemy.orm import Session

def create_transaction(db: Session, transaction_data):
    # DB query to create transaction
    pass

def get_transaction(db: Session, transaction_id: int):
    # DB query to get transaction
    pass

def update_transaction(db: Session, transaction_id: int, transaction_data):
    # DB query to update transaction
    pass

def delete_transaction(db: Session, transaction_id: int):
    # DB query to delete transaction
    pass
