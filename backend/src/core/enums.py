
from enum import Enum

class FarmerStockMode(str, Enum):
    """Stock tracking mode for farmer inventory"""
    DECLARED = "declared"    # Farmer declared stock upfront
    IMPLICIT = "implicit"    # Stock tracked only through sales
    
    @classmethod
    def get_description(cls, mode):
        descriptions = {
            cls.DECLARED: "Stock declared upfront by farmer",
            cls.IMPLICIT: "Stock tracked through sales only"
        }
        return descriptions.get(mode, "Unknown mode")

class RecordStatus(str, Enum):
    """General record status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    DELETED = "deleted"

class AuditAction(str, Enum):
    """Audit trail actions for farmer stock"""
    DECLARE = "declare"           # Initial stock declaration
    SALE = "sale"                # Stock sold through transaction
    UPDATE = "update"            # Manual stock adjustment
    LATE_DECLARE = "late_declare" # Late stock declaration
    CARRY_FORWARD = "carry_forward" # Stock carried to next day
    CORRECTION = "correction"     # Error correction
    MODE_CHANGE = "mode_change"   # Changed from implicit to declared
    
    @classmethod
    def get_description(cls, action):
        descriptions = {
            cls.DECLARE: "Stock declared by farmer",
            cls.SALE: "Stock sold in transaction",
            cls.UPDATE: "Manual stock update",
            cls.LATE_DECLARE: "Late stock declaration added",
            cls.CARRY_FORWARD: "Stock carried to next day",
            cls.CORRECTION: "Stock correction applied",
            cls.MODE_CHANGE: "Stock mode changed"
        }
        return descriptions.get(action, "Unknown action")

class UserRole(str, Enum):
    """User roles in the system"""
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    EMPLOYEE = "employee"
    FARMER = "farmer"
    BUYER = "buyer"

class TransactionStatus(str, Enum):
    """Transaction status"""
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentStatus(str, Enum):
    """Payment status"""
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
