from decimal import Decimal
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from src.models import Transaction, TransactionItem, Payment, FarmerPayment
from src.models.enums import TransactionStatus, PaymentType, RecordStatus

class DailySummaryService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_daily_summary(self, shop_id: int, summary_date: date = None) -> dict:
        """
        End-of-day cash reconciliation - replaces manual book balancing
        """
        if not summary_date:
            summary_date = date.today()
        
        # Total sales for the day
        daily_sales = self.db.query(
            func.sum(TransactionItem.quantity * TransactionItem.price)
        ).join(Transaction).filter(
            and_(
                Transaction.shop_id == shop_id,
                Transaction.date == summary_date,
                Transaction.status == TransactionStatus.COMPLETED.value
            )
        ).scalar() or Decimal("0.00")
        
        # Total commission earned
        daily_commission = self.db.query(
            func.sum(Transaction.commission_amount)
        ).filter(
            and_(
                Transaction.shop_id == shop_id,
                Transaction.date == summary_date,
                Transaction.status == TransactionStatus.COMPLETED.value
            )
        ).scalar() or Decimal("0.00")
        
        # Cash received from buyers
        cash_received = self.db.query(
            func.sum(Payment.amount)
        ).join(Transaction).filter(
            and_(
                Transaction.shop_id == shop_id,
                Payment.date == summary_date,
                Payment.type.in_([
                    PaymentType.FULL_PAYMENT.value,
                    PaymentType.PARTIAL_PAYMENT.value
                ])
            )
        ).scalar() or Decimal("0.00")
        
        # Cash paid to farmers
        cash_paid_farmers = self.db.query(
            func.sum(FarmerPayment.amount)
        ).filter(
            and_(
                FarmerPayment.shop_id == shop_id,
                FarmerPayment.date == summary_date,
                FarmerPayment.status == RecordStatus.ACTIVE.value
            )
        ).scalar() or Decimal("0.00")
        
        # Net cash position
        net_cash = cash_received - cash_paid_farmers
        
        # Outstanding amounts (sum of unpaid amounts for pending/partial transactions)
        outstanding_from_buyers = self.db.query(
            func.sum(Transaction.total_amount - Transaction.buyer_paid_amount)
        ).filter(
            and_(
                Transaction.shop_id == shop_id,
                Transaction.payment_status.in_(["pending", "partial"])
            )
        ).scalar() or Decimal("0.00")
        
        return {
            "date": summary_date,
            "shop_id": shop_id,
            "total_sales": float(daily_sales),
            "total_commission": float(daily_commission),
            "cash_received": float(cash_received),
            "cash_paid_farmers": float(cash_paid_farmers),
            "net_cash_position": float(net_cash),
            "outstanding_from_buyers": float(outstanding_from_buyers),
            "summary_generated_at": datetime.utcnow()
        }
