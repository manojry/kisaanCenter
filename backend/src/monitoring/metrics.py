
import time
import psutil
from typing import Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from src.models import Transaction, User, Shop
from src.database import SessionLocal

class MetricsCollector:
    def __init__(self):
        self.start_time = datetime.utcnow()
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Collect system performance metrics"""
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent,
                "used": psutil.virtual_memory().used
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "used": psutil.disk_usage('/').used,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent
            },
            "network": {
                "bytes_sent": psutil.net_io_counters().bytes_sent,
                "bytes_recv": psutil.net_io_counters().bytes_recv,
                "packets_sent": psutil.net_io_counters().packets_sent,
                "packets_recv": psutil.net_io_counters().packets_recv
            },
            "uptime_seconds": (datetime.utcnow() - self.start_time).total_seconds()
        }
    
    def get_database_metrics(self, db: Session) -> Dict[str, Any]:
        """Collect database performance metrics"""
        try:
            # Table counts
            user_count = db.query(User).count()
            shop_count = db.query(Shop).count()
            transaction_count = db.query(Transaction).count()
            
            # Recent activity (last 24 hours)
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_transactions = db.query(Transaction).filter(
                Transaction.created_at >= yesterday
            ).count()
            
            recent_users = db.query(User).filter(
                User.created_at >= yesterday
            ).count()
            
            # Transaction status breakdown
            transaction_statuses = db.query(
                Transaction.status,
                db.func.count(Transaction.id)
            ).group_by(Transaction.status).all()
            
            status_breakdown = {status: count for status, count in transaction_statuses}
            
            return {
                "total_records": {
                    "users": user_count,
                    "shops": shop_count,
                    "transactions": transaction_count
                },
                "recent_activity": {
                    "transactions_24h": recent_transactions,
                    "new_users_24h": recent_users
                },
                "transaction_status_breakdown": status_breakdown,
                "database_size_mb": self._get_database_size(db)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def _get_database_size(self, db: Session) -> float:
        """Get database size in MB"""
        try:
            result = db.execute(
                "SELECT pg_size_pretty(pg_database_size(current_database()))"
            ).scalar()
            # Parse size string and convert to MB
            if 'MB' in result:
                return float(result.replace(' MB', ''))
            elif 'GB' in result:
                return float(result.replace(' GB', '')) * 1024
            elif 'KB' in result:
                return float(result.replace(' KB', '')) / 1024
            return 0.0
        except:
            return 0.0
    
    def get_business_metrics(self, db: Session) -> Dict[str, Any]:
        """Collect business-specific metrics"""
        try:
            # Revenue metrics (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            recent_transactions = db.query(Transaction).filter(
                Transaction.created_at >= thirty_days_ago,
                Transaction.status == "COMPLETED"
            ).all()
            
            total_revenue = sum(t.total_amount for t in recent_transactions)
            total_commission = sum(t.commission_amount for t in recent_transactions)
            
            # Active users by role
            active_users = db.query(
