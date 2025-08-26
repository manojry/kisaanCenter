from ..models import Credit
from sqlalchemy.orm import Session

def create_credit(db: Session, credit_data):
    # DB query to create credit
    pass

def get_credit(db: Session, credit_id: int):
    # DB query to get credit
    pass

def update_credit(db: Session, credit_id: int, credit_data):
    # DB query to update credit
    pass

def delete_credit(db: Session, credit_id: int):
    # DB query to delete credit
    pass
