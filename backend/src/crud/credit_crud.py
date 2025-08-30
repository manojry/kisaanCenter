
from sqlalchemy.orm import Session
from typing import List, Optional

# Remove the direct model imports from here
# from ..database.models import Credit, User 
from ..schemas.credit_schemas import CreditCreate, CreditUpdate
from ..core.enums import RecordStatus

def create_credit(db: Session, credit: CreditCreate) -> "Credit":
    """Create a new credit record."""
    from ..database.models import Credit  # Import inside function
    db_credit = Credit(**credit.dict())
    db.add(db_credit)
    db.commit()
    db.refresh(db_credit)
    return db_credit

def get_credit_by_id(db: Session, credit_id: int) -> Optional["Credit"]:
    """Get a credit record by its ID."""
    from ..database.models import Credit  # Import inside function
    return db.query(Credit).filter(Credit.id == credit_id, Credit.status == RecordStatus.ACTIVE).first()

def get_credits_by_shop(db: Session, shop_id: int, skip: int = 0, limit: int = 100) -> List["Credit"]:
    """Get all active credit records for a specific shop."""
    from ..database.models import Credit  # Import inside function
    return db.query(Credit).filter(Credit.shop_id == shop_id, Credit.status == RecordStatus.ACTIVE).offset(skip).limit(limit).all()

def update_credit(db: Session, credit_id: int, credit_update: CreditUpdate) -> Optional["Credit"]:
    """Update an existing credit record."""
    # get_credit_by_id will handle the import
    db_credit = get_credit_by_id(db, credit_id)
    if db_credit:
        update_data = credit_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_credit, key, value)
        db.commit()
        db.refresh(db_credit)
    return db_credit

def delete_credit(db: Session, credit_id: int) -> Optional["Credit"]:
    """Soft delete a credit record by setting its status to INACTIVE."""
    # get_credit_by_id will handle the import
    db_credit = get_credit_by_id(db, credit_id)
    if db_credit:
        db_credit.status = RecordStatus.INACTIVE
        db.commit()
        db.refresh(db_credit)
    return db_credit
