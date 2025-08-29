
from enum import Enum

class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    FARMER = "farmer"
    BUYER = "buyer"
    EMPLOYEE = "employee"

class RecordStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DELETED = "DELETED"

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class CompletionStatus(str, Enum):
    INCOMPLETE = "INCOMPLETE"
    COMPLETE = "COMPLETE"

class CreditStatus(str, Enum):
    OUTSTANDING = "OUTSTANDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    OVERDUE = "OVERDUE"

class PaymentType(str, Enum):
    FULL_PAYMENT = "FULL_PAYMENT"
    PARTIAL_PAYMENT = "PARTIAL_PAYMENT"
    ADVANCE = "ADVANCE"
