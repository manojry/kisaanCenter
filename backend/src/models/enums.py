from enum import Enum

class UserRole(str, Enum):
	SUPERADMIN = "superadmin"
	OWNER = "owner"
	FARMER = "farmer"
	BUYER = "buyer"
	EMPLOYEE = "employee"

class RecordStatus(str, Enum):
	ACTIVE = "active"
	INACTIVE = "inactive"
	DELETED = "deleted"

class TransactionStatus(str, Enum):
	PENDING = "pending"
	PROCESSING = "processing"
	COMPLETED = "completed"
	CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
	PENDING = "pending"
	PARTIAL = "partial"
	COMPLETED = "completed"
	FAILED = "failed"

class CompletionStatus(str, Enum):
	INCOMPLETE = "incomplete"
	COMPLETE = "complete"

class CreditStatus(str, Enum):
	OUTSTANDING = "outstanding"
	PARTIAL = "partial"
	PAID = "paid"
	OVERDUE = "overdue"

class PaymentType(str, Enum):
	FULL_PAYMENT = "full_payment"
	PARTIAL_PAYMENT = "partial_payment"
	ADVANCE = "advance"

class StockMode(str, Enum):
	DECLARED = "declared"
	VERIFIED = "verified"
	ACTUAL = "actual"

class StockStatus(str, Enum):
	IN_STOCK = "in_stock"
	OUT_OF_STOCK = "out_of_stock"
	EXPIRED = "expired"

class TransactionType(str, Enum):
	SALE = "sale"
	RETURN = "return"
	ADJUSTMENT = "adjustment"

class FarmerPaymentType(str, Enum):
	CASH = "cash"
	BANK_TRANSFER = "bank_transfer"
	CHEQUE = "cheque"

class BillingCycle(str, Enum):
	MONTHLY = "monthly"
	QUARTERLY = "quarterly"
	YEARLY = "yearly"

class SubscriptionStatus(str, Enum):
	ACTIVE = "active"
	INACTIVE = "inactive"
	EXPIRED = "expired"
	CANCELLED = "cancelled"

# Add any additional enums here as needed
