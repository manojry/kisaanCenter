from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Credit
from ..schemas import CreditCreate, CreditRead

router = APIRouter(prefix="/credits", tags=["credits"])

@router.post("/", response_model=CreditRead)
def create_credit(credit: CreditCreate, db: Session = Depends(get_db)):
    # ...implement credit creation...
    pass

@router.get("/{credit_id}", response_model=CreditRead)
def get_credit(credit_id: int, db: Session = Depends(get_db)):
    # ...implement get credit by id...
    pass

@router.put("/{credit_id}", response_model=CreditRead)
def update_credit(credit_id: int, credit: CreditCreate, db: Session = Depends(get_db)):
    # ...implement update credit...
    pass

@router.delete("/{credit_id}")
def delete_credit(credit_id: int, db: Session = Depends(get_db)):
    # ...implement delete credit...
    pass
