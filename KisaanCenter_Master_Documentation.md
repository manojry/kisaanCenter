# KisaanCenter Master Documentation

## 1. Schema Overview

### Core Tables
- **users**: Unified user table with roles (owner, farmer, buyer, employee, superadmin)
- **shops**: Shop details, owner linkage, plan info
- **categories**: Product categories
- **products**: Product details, category linkage
- **farmer_stock**: Stock records (use `farmer_id` everywhere)
- **transactions**: Sales/purchase/return records, buyer linkage
- **transaction_items**: Itemized transaction details, farmer linkage
- **payments**: Payment records, method, type, status
- **farmer_payments**: Farmer payment records, type, status
- **credits**: Credit records for users
- **audit tables**: Stock audit, user activity

### Key Enums
- `user_role`, `record_status`, `transaction_status`, `transaction_type`, `payment_status`, `payment_type`, `farmer_payment_type`, `credit_status`, `completion_status`, `stock_status`, `subscription_status`, `billing_cycle`

## 2. API Endpoints

### Farmer Stock
- `POST /api/v1/farmer-stock/` - Create stock record
- `GET /api/v1/farmer-stock/{id}` - Get stock details
- `PUT /api/v1/farmer-stock/{id}` - Update stock record
- `DELETE /api/v1/farmer-stock/{id}` - Soft delete stock record
- `POST /api/v1/farmer-stock/{id}/declare` - Late stock declaration
- `PUT /api/v1/farmer-stock/{id}/mode` - Change stock mode
- `POST /api/v1/farmer-stock/{id}/deduct` - Deduct stock for sale
- `POST /api/v1/farmer-stock/{id}/carry-forward` - Carry forward remaining stock
- `GET /api/v1/farmer-stock/{id}/audit` - Get audit trail

### Farmer Payments
- `POST /api/v1/farmer-payments` - Record Farmer Payment
- `GET /api/v1/farmer-payments/{id}` - Get payment details
- `GET /api/v1/farmer-payments/farmer/{farmer_id}` - List payments for farmer

### Dashboard & Analytics
- `GET /api/v1/dashboard/owner/{shop_id}` - Owner Dashboard
- `GET /api/v1/dashboard/farmer/{farmer_id}` - Farmer Dashboard
- `GET /api/v1/dashboard/buyer/{user_id}` - Buyer Dashboard

## 3. Business Rules & Computed Fields
- **Stock**: `balance_qty = declared_qty - sold_qty` (NULL if not declared)
- **Oversold Alert**: `sold_qty > declared_qty`
- **Completion %**: `(sold_qty / declared_qty) * 100` (NULL if not declared)
- **Payment Settlement**: `settlement = sale - commission - advance`
- **Commission**: Defined per product, stored in transaction

## 4. Relationships
- `farmer_stock.farmer_id` → users.id
- `farmer_stock.product_id` → products.id
- `farmer_payments.farmer_id` → users.id
- `transaction_items.farmer_id` → users.id
- `transactions.buyer_id` → users.id
- `products.category_id` → categories.id
- `users.shop_id` → shops.id

## 5. Workflows
### Farmer
- Deliver stock → recorded in system
- Dashboard: sold, unsold stock
- Request advance/settlement
- Settlement deducts commission, adjusts balance

### Buyer
- Select products, transaction recorded
- Pay (full/partial/credit)
- Credit ledger updated

### Owner
- Monitor transactions, commissions, credits
- Manage users, credit limits
- View analytics

### Employee
- Manage deliveries, stock adjustments, returns
- Quality control

## 6. Example Queries
```sql
-- Track my sales today
SELECT p.name, ti.quantity, ti.price, (ti.quantity * ti.price) as revenue
FROM transaction_items ti
JOIN farmer_stock fs ON ti.farmer_stock_id = fs.id
JOIN products p ON ti.product_id = p.id
WHERE fs.farmer_id = {farmer_id} AND DATE(ti.created_at) = CURRENT_DATE;

-- Check remaining stock
SELECT p.name, fs.quantity, fs.status
FROM farmer_stock fs
JOIN products p ON fs.product_id = p.id
WHERE fs.farmer_id = {farmer_id} AND fs.status = 'in_stock';
```

## 7. Audit & Monitoring
- Audit trail for all stock changes
- Alerts: overselling, low declaration rate, unusual patterns
- Performance: index usage, partitioning, query speed

## 8. Data Privacy & Access Control
- Farmers: access own stock, payments
- Owners: access all shop data
- Employees: limited access (stock, adjustments)
- Buyers: access own transactions

---

This master documentation consolidates schema, API, business logic, workflows, and best practices for KisaanCenter. All references to `farmer_user_id` are replaced with `farmer_id`. Duplicate and outdated content is removed. Use this as the single source of truth for backend, frontend, and integration work.
