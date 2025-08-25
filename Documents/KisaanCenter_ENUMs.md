
# KisaanCenter ENUMs Reference (Cross-Referenced with ERD)

## USER
- role: 'superadmin', 'owner', 'employee', 'farmer', 'buyer'
- status: 'active', 'inactive', 'suspended'

## SHOP
- status: 'active', 'inactive', 'suspended', 'closed'

## PRODUCT
- status: 'active', 'inactive', 'discontinued'
- category: (reference table, e.g., 'rose', 'marigold', 'jasmine', 'lily', ...)

## FARMER_STOCK
- status: 'active', 'closed', 'discarded', 'returned'

## FARMER_STOCK_COMMENT
- (no ENUM fields, just text)

## TRANSACTION
- payment_status: 'paid', 'partial', 'credit', 'pending'
- type: 'sale', 'return', 'exchange'

## TRANSACTION_ITEM
- status: 'active', 'returned', 'exchanged'

## PAYMENT
- payment_type: 'buyer_to_shop', 'shop_to_farmer'
- status: 'pending', 'completed', 'failed', 'refunded', 'partial'
- method: 'cash', 'online', 'upi', 'card', 'cheque', 'wallet'
- type: 'full', 'partial', 'credit'

## EXPENSE
- type: 'wage', 'rent', 'utility', 'supplies', 'lunch', 'tea', 'other'
- status: 'active', 'archived'

## PLAN
- name: 'basic', 'premium', 'enterprise', 'custom'
- status: 'active', 'inactive', 'expired', 'suspended'
- features: (reference table or JSON, e.g., 'advanced_analytics', 'bulk_sms', 'multi_region')

## CATEGORY
- name: (reference table, e.g., 'rose', 'marigold', 'jasmine', 'lily', ...)

## AUDIT_LOG
- entity_type: 'user', 'shop', 'product', 'farmer_stock', 'transaction', 'payment', 'expense', 'plan', 'other'

---

This ENUM reference is cross-checked with the ERD and covers all fields and cases. Use these for database fields, application logic, and API validation to ensure consistency and maintainability across KisaanCenter.
