from enum import Enum

class UserRole(str, Enum):
    superadmin = "superadmin"
    owner = "owner"
    farmer = "farmer"
    buyer = "buyer"
    employee = "employee"

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
