from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import PaymentCreate, PaymentUpdate, APIResponse, PaginationParams
from ..services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    result = PaymentService.create_payment(db, payment)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{payment_id}", response_model=APIResponse)
def get_payment(payment_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = PaymentService.get_payment(db, payment_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get("/", response_model=APIResponse)
def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    result = PaymentService.get_payments(db, pagination)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put("/{payment_id}", response_model=APIResponse)
def update_payment(
    payment_id: int = Path(..., gt=0),
    payment_update: PaymentUpdate = ...,
    db: Session = Depends(get_db)
):
    result = PaymentService.update_payment(db, payment_id, payment_update)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.delete("/{payment_id}", response_model=APIResponse)
def delete_payment(payment_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = PaymentService.delete_payment(db, payment_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result
