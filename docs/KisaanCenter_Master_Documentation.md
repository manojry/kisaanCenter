
# KisaanCenter Master Documentation

## 🌾 Core Concept: Transforming Agricultural Markets

KisaanCenter is an enterprise-grade Agricultural Market Management System designed to digitize and streamline the traditional agricultural marketplace. At its core, KisaanCenter addresses the fundamental challenges in agricultural commerce by creating a transparent, efficient, and fair digital ecosystem connecting farmers, buyers, and market operators.

## 🎯 The Vision

In many agricultural markets, especially in developing regions, the traditional marketplace operates with limited transparency, inefficient record-keeping, and complex multi-party transactions. KisaanCenter transforms this ecosystem by:

1. **Digitizing the entire marketplace** - From farmer stock delivery to final buyer payment
2. **Creating transparency** - Clear tracking of prices, commissions, and payments
3. **Ensuring fair compensation** - Proper accounting for all parties involved
4. **Streamlining operations** - Efficient management of stock, sales, and payments
5. **Building trust** - Complete audit trails and transaction verification

## 🧩 The Three-Party Completion Model

The heart of KisaanCenter is its unique **Three-Party Completion Model** for transactions:

1. **Farmer** delivers products → recorded in system → awaits payment
2. **Buyer** purchases products → may pay in full, partial, or on credit
3. **Shop Owner** manages the marketplace → collects commission → ensures proper settlement

A transaction is only considered complete when all three checkboxes are ticked:
- ✅ Buyer payment complete
- ✅ Farmer payment complete
- ✅ Commission confirmed

This model ensures that no party is forgotten in the transaction lifecycle and creates accountability at every step.

## 👥 Key Stakeholders and Their Journeys

### 1. Farmers
**Journey**: From product delivery to payment receipt
- Deliver agricultural products to the market
- Track sales of their products in real-time
- Request advances or settlements
- View complete payment history and outstanding amounts
- Manage their product portfolio based on market demand

### 2. Buyers
**Journey**: From product selection to payment
- Browse available products from multiple farmers
- Make purchases with flexible payment options
- Track credit and outstanding payments
- Build relationships with trusted farmers and shops
- Access purchase history and receipts

### 3. Shop Owners
**Journey**: From market management to profit generation
- Manage the marketplace operations
- Set commission rates and business rules
- Process farmer payments and buyer credits
- Track expenses and generate financial reports
- Analyze business performance and optimize operations

### 4. Employees
**Journey**: From daily operations to customer service
- Process transactions on behalf of the shop

---

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
