from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Payment
from ..schemas import PaymentCreate, PaymentRead

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/", response_model=PaymentRead)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    # ...implement payment creation...
    pass

@router.get("/{payment_id}", response_model=PaymentRead)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    # ...implement get payment by id...
    pass

@router.put("/{payment_id}", response_model=PaymentRead)
def update_payment(payment_id: int, payment: PaymentCreate, db: Session = Depends(get_db)):
    # ...implement update payment...
    pass

@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    # ...implement delete payment...
    pass
