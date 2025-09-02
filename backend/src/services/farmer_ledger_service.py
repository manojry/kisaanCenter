from decimal import Decimal
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..models import User, TransactionItem, FarmerPayment, FarmerStock, Transaction, TransactionStatus

class FarmerLedgerService:
    def process_farmer_payment(self, farmer_id: int, payment_data) -> dict:
        """
        Process payment to farmer - deduct from their balance
        Critical for maintaining accurate farmer accounts
        """
        # Check farmer balance first
        balance_info = self.get_farmer_balance(farmer_id, payment_data.shop_id)
        current_balance = Decimal(str(balance_info["current_balance"]))
        payment_amount = Decimal(str(payment_data.amount))
        if payment_amount > current_balance and getattr(payment_data, "payment_type", None) != "advance":
            raise ValueError(f"Payment amount {payment_amount} exceeds farmer balance {current_balance}")
        # Create farmer payment record
        farmer_payment = FarmerPayment(
            farmer_user_id=farmer_id,
            shop_id=payment_data.shop_id,
            amount=payment_amount,
            payment_method=payment_data.payment_method,
            payment_type=getattr(payment_data, "payment_type", None),
            date=date.today(),
            notes=getattr(payment_data, "notes", None),
            status="active",
            created_at=datetime.utcnow()
        )
        self.db.add(farmer_payment)
        self.db.commit()
        # Return updated balance
        new_balance = self.get_farmer_balance(farmer_id, payment_data.shop_id)
        return {
            "payment_id": farmer_payment.id,
            "amount_paid": float(payment_amount),
            "payment_method": payment_data.payment_method,
            "previous_balance": float(current_balance),
            "new_balance": new_balance["current_balance"],
            "payment_date": date.today()
        }

    def get_farmers_requiring_settlement(self, shop_id: int, min_balance: float = 100.0) -> list:
        """
        Get list of farmers with balance above threshold for settlement
        Helps shop owner prioritize payments
        """
        farmers = self.db.query(User).filter(
            User.shop_id == shop_id,
            User.role == "farmer",
            User.status == "active"
        ).all()
        farmers_to_settle = []
        for farmer in farmers:
            balance_info = self.get_farmer_balance(farmer.id, shop_id)
            if balance_info["current_balance"] >= min_balance:
                farmers_to_settle.append({
                    "farmer_id": farmer.id,
                    "farmer_name": getattr(farmer, "username", None),
                    "balance": balance_info["current_balance"],
                    "last_transaction": balance_info.get("last_transaction_date"),
                    "priority": "high" if balance_info["current_balance"] > 1000 else "normal"
                })
        # Sort by balance descending
        farmers_to_settle.sort(key=lambda x: x["balance"], reverse=True)
        return farmers_to_settle
    def __init__(self, db: Session):
        self.db = db
    
    def get_farmer_balance(self, farmer_id: int, shop_id: int) -> dict:
        """Get real-time farmer balance like a bank account"""
        
        # Total sales amount (credit to farmer)
        sales_total = self.db.query(
            func.sum(TransactionItem.quantity * TransactionItem.price)
        ).join(Transaction).filter(
            and_(
                TransactionItem.farmer_id == farmer_id,
                Transaction.shop_id == shop_id,
                Transaction.status == TransactionStatus.COMPLETED
            )
        ).scalar() or Decimal("0.00")
        
        # Total payments made to farmer (debit from farmer)
        payments_total = self.db.query(
            func.sum(FarmerPayment.amount)
        ).filter(
            and_(
                FarmerPayment.farmer_user_id == farmer_id,
                FarmerPayment.shop_id == shop_id,
                FarmerPayment.status == "active"
            )
        ).scalar() or Decimal("0.00")
        
        # Commission deduction
        commission_total = self.db.query(
            func.sum(Transaction.commission_amount)
        ).join(TransactionItem).filter(
            and_(
                TransactionItem.farmer_id == farmer_id,
                Transaction.shop_id == shop_id,
                Transaction.status == TransactionStatus.COMPLETED
            )
        ).scalar() or Decimal("0.00")
        
        balance = sales_total - commission_total - payments_total
        
        return {
            "farmer_id": farmer_id,
            "total_sales": float(sales_total),
            "total_commission": float(commission_total),
            "total_payments": float(payments_total),
            "current_balance": float(balance),
            "last_updated": datetime.utcnow()
        }
    
    def get_farmer_ledger(self, farmer_id: int, shop_id: int, 
                         from_date: date = None, to_date: date = None) -> dict:
        """Get detailed farmer transaction history"""
        
        # Get all transactions
        query = self.db.query(TransactionItem).join(Transaction).filter(
            and_(
                TransactionItem.farmer_id == farmer_id,
                Transaction.shop_id == shop_id
            )
        )
        
        if from_date:
            query = query.filter(Transaction.date >= from_date)
        if to_date:
            query = query.filter(Transaction.date <= to_date)
            
        transactions = query.order_by(Transaction.date.desc()).all()
        
        # Get all payments
        payments_query = self.db.query(FarmerPayment).filter(
            and_(
                FarmerPayment.farmer_user_id == farmer_id,
                FarmerPayment.shop_id == shop_id
            )
        )
        
        if from_date:
            payments_query = payments_query.filter(FarmerPayment.date >= from_date)
        if to_date:
            payments_query = payments_query.filter(FarmerPayment.date <= to_date)
            
        payments = payments_query.order_by(FarmerPayment.date.desc()).all()
        
        return {
            "farmer_id": farmer_id,
            "transactions": [self._format_transaction(t) for t in transactions],
            "payments": [self._format_payment(p) for p in payments],
            "balance": self.get_farmer_balance(farmer_id, shop_id)
        }
    
    def _format_transaction(self, transaction_item):
        """Format transaction item for ledger display"""
        return {
            "transaction_id": transaction_item.transaction_id,
            "product_name": transaction_item.product.name,
            "quantity": transaction_item.quantity,
            "rate": float(transaction_item.price),
            "amount": float(transaction_item.quantity * transaction_item.price),
            "date": transaction_item.transaction.date
        }
    
    def _format_payment(self, payment):
        """Format payment for ledger display"""
        return {
            "payment_id": payment.id,
            "amount": float(payment.amount),
            "date": payment.date,
            "payment_method": payment.payment_method,
            "remarks": payment.remarks
        }

    @staticmethod
    def process_farmer_payment(db: Session, farmer_id: int, amount: float):
        """Process payment/settlement to farmer."""
        # TODO: Update ledger, create payment record, update balance
        pass

    @staticmethod
    def get_daily_settlement_summary(db: Session, date: date):
        """Daily settlement summary for all farmers."""
        # TODO: Aggregate all farmer payments and balances for the day
        pass