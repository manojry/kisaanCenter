# models/__init__.py
from .base import Base

# Import enums first
from .enums import UserRole, RecordStatus, TransactionStatus, PaymentStatus, PaymentType, StockMode, CompletionStatus, TransactionType, StockStatus

# Import models
try:
    from .category import Category
except ImportError:
    pass
try:
    from .plan import Plan
except ImportError:
    pass
try:
    from .subscription import Subscription
except ImportError:
    pass
try:
    from .user import User
except ImportError:
    print("Warning: Could not import User model")

try:
    from .superadmin import Superadmin
except ImportError:
    print("Warning: Could not import Superadmin model")

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
    from .expense_category import ExpenseCategory
except ImportError:
    pass
try:
    from .credit import Credit
except ImportError:
    pass

try:
    from .payment import Payment, PaymentMethod, FarmerPayment
except ImportError:
    pass

# Make enums and models available from package root
__all__ = [
    "Base", 
    "UserRole", "RecordStatus", "TransactionStatus", "PaymentStatus", "PaymentType", "StockMode", "CompletionStatus", "TransactionType", "StockStatus",
    "User", "Superadmin", "Shop", "Product", "Transaction", "TransactionItem", 
    "FarmerStock", "ExpenseCategory", "Credit", "Payment", "PaymentMethod", "FarmerPayment", "Category", "Plan", "Subscription"
]
