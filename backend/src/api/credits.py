from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import CreditCreate, CreditUpdate, APIResponse, PaginationParams
from ..services.credit_service import CreditService

router = APIRouter(prefix="/credits", tags=["Credits"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_credit(credit: CreditCreate, db: Session = Depends(get_db)):
    result = CreditService.create_credit(db, credit)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.get("/{credit_id}", response_model=APIResponse)
def get_credit(credit_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = CreditService.get_credit(db, credit_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get("/", response_model=APIResponse)
def get_credits(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    result = CreditService.get_credits(db, pagination)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put("/{credit_id}", response_model=APIResponse)
def update_credit(
    credit_id: int = Path(..., gt=0),
    credit_update: CreditUpdate = ...,
    db: Session = Depends(get_db)
):
    result = CreditService.update_credit(db, credit_id, credit_update)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.delete("/{credit_id}", response_model=APIResponse)
def delete_credit(credit_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    result = CreditService.delete_credit(db, credit_id)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result
