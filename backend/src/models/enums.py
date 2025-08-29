from enum import Enum

class RecordStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DELETED = "deleted"
    PENDING = "pending"
    SUSPENDED = "suspended"
