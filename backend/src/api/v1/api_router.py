from fastapi import APIRouter
from .endpoints import transactions, farmers, daily_summary, products, users
## Removed unresolved import for transaction_router
from ..auth import router as auth_router
from ..owner_admin import router as owner_admin_router
from ..dashboard import router as dashboards_router
from ..stock_management import router as stock_management_router
from ..transactions import router as transactions_router
from ..farmers import router as farmers_router
from ..daily_summary import router as daily_summary_router
from ..products import router as products_router
from ..users import router as users_router
from ..superadmin import router as superadmin_router

api_router = APIRouter()

# Authentication (CRITICAL)
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])

# Owner administration (CRITICAL)
api_router.include_router(owner_admin_router, prefix="/owner-admin", tags=["owner-admin"])

# Role-based dashboards (CRITICAL)
api_router.include_router(dashboards_router, prefix="", tags=["dashboards"])

# Stock management (HIGH PRIORITY)
api_router.include_router(stock_management_router, prefix="/farmer-stock", tags=["stock"])

# Existing routes
api_router.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
api_router.include_router(superadmin_router, prefix="/admin", tags=["superadmin"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
