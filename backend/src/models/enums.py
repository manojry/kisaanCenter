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
    PENDING = "pending"
    SUSPENDED = "suspended"

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
