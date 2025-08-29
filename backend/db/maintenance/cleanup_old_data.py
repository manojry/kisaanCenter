
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.database import SessionLocal
from src.models import Transaction, Payment, Credit
import logging

logger = logging.getLogger(__name__)

def cleanup_old_transactions(db: Session, days_old: int = 365):
    """Archive transactions older than specified days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    # Find old completed transactions
    old_transactions = db.query(Transaction).filter(
        Transaction.created_at < cutoff_date,
        Transaction.status == "COMPLETED"
    ).all()
    
    logger.info(f"Found {len(old_transactions)} transactions to archive")
    
    # Archive logic here (move to archive table or mark as archived)
    for transaction in old_transactions:
        transaction.status = "ARCHIVED"
    
    db.commit()
    logger.info(f"Archived {len(old_transactions)} old transactions")

def cleanup_old_logs(days_old: int = 90):
    """Clean up old log files"""
    import os
    import glob
    
    log_dir = "logs"
    cutoff_date = datetime.now() - timedelta(days=days_old)
    
    log_files = glob.glob(os.path.join(log_dir, "*.log*"))
    
    for log_file in log_files:
        file_time = datetime.fromtimestamp(os.path.getmtime(log_file))
        if file_time < cutoff_date:
            os.remove(log_file)
            logger.info(f"Removed old log file: {log_file}")

def cleanup_expired_payments(db: Session, days_old: int = 30):
    """Remove expired payment records"""
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    expired_payments = db.query(Payment).filter(
        Payment.created_at < cutoff_date,
        Payment.status != "COMPLETED"
    ).all()
    
    logger.info(f"Found {len(expired_payments)} expired payments to remove")
    
    for payment in expired_payments:
        db.delete(payment)
    
    db.commit()
    logger.info(f"Removed {len(expired_payments)} expired payments")

def cleanup_expired_credits(db: Session, days_old: int = 365):
    """Remove expired credit records"""
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    expired_credits = db.query(Credit).filter(
        Credit.created_at < cutoff_date,
        Credit.status != "ACTIVE"
    ).all()
    
    logger.info(f"Found {len(expired_credits)} expired credits to remove")
    
    for credit in expired_credits:
        db.delete(credit)
    
    db.commit()
    logger.info(f"Removed {len(expired_credits)} expired credits")
