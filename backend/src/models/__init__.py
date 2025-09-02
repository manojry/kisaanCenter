# models/__init__.py
from .base import Base

# Import enums first
from .enums import UserRole, RecordStatus, TransactionStatus, PaymentStatus, PaymentType, StockMode

# Import models
try:
    from .user import User
except ImportError:
    pass

try:
    from .superadmin import Superadmin
except ImportError:
    pass

try:
    from .shop import Shop
except ImportError:
    pass

try:
    from .product import Product
except ImportError:
    pass

try:
    from .transaction import Transaction
except ImportError:
    pass

try:
    from .transaction_item import TransactionItem
except ImportError:
    pass

try:
    from .farmer_stock import FarmerStock
except ImportError:
    pass

try:
    from .payment import Payment, PaymentMethod, FarmerPayment
except ImportError:
    pass

# Make enums and models available from package root
__all__ = [
    "Base", 
    "UserRole", "RecordStatus", "TransactionStatus", "PaymentStatus", "PaymentType", "StockMode",
    "User", "Superadmin", "Shop", "Product", "Transaction", "TransactionItem", 
    "FarmerStock", "Payment", "PaymentMethod", "FarmerPayment"
]
