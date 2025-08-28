from fastapi import APIRouter, Depends, Query, Path, status, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import AuditLog, User, Shop, UserRole
from ..schemas import APIResponse
from datetime import datetime

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/logs", response_model=APIResponse, status_code=status.HTTP_200_OK)
def get_audit_logs(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    shop_id: Optional[int] = Query(None, description="Filter by shop ID"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    action: Optional[str] = Query(None, description="Filter by action (INSERT, UPDATE, DELETE)"),
    start_date: Optional[datetime] = Query(None, description="Start date for logs"),
    end_date: Optional[datetime] = Query(None, description="End date for logs"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get system-wide audit logs. Superadmin can filter by user, shop, entity, action, date.
    """
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if shop_id:
        query = query.filter(AuditLog.shop_id == shop_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    total = query.count()
    offset = (page - 1) * limit
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    data = [
        {
            "id": log.id,
            "shop_id": log.shop_id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "user_id": log.user_id,
            "action": log.action,
            "old_data": log.old_data,
            "new_data": log.new_data,
            "created_at": log.created_at
        } for log in logs
    ]
    return APIResponse(success=True, message="Audit logs retrieved", data={"logs": data, "total": total, "page": page, "limit": limit})
