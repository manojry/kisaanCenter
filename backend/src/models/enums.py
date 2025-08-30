from enum import Enum

class RecordStatus(str, Enum):
    """Enum for record status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DELETED = "deleted"

class UserRole(str, Enum):
    """Enum for user roles"""
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class TransactionStatus(str, Enum):
    """Enum for transaction status"""
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    """Enum for payment status"""
    PENDING = "pending"
    UNPAID = "unpaid"
    PAID = "paid"
    PARTIAL = "partial"

class CompletionStatus(str, Enum):
    """Enum for completion status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"

class StockStatus(str, Enum):
    """Enum for stock status"""
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
    LOW_STOCK = "low_stock"

class SubscriptionStatus(str, Enum):
    """Enum for subscription status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class BillingCycle(str, Enum):
    """Enum for billing cycles"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class TransactionType(str, Enum):
    """Enum for transaction types"""
    SALE = "sale"
    PURCHASE = "purchase"
    RETURN = "return"

class CreditStatus(str, Enum):
    """Enum for credit status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class PaymentType(str, Enum):
    """Enum for payment types"""
    CASH = "cash"
    CARD = "card"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"

class FarmerPaymentType(str, Enum):
    """Enum for farmer payment types"""
    ADVANCE = "advance"
    FINAL = "final"
    BONUS = "bonus"
