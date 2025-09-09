# KisaanCenter Models Analysis & Documentation

## Table Naming Pattern Analysis
✅ **Correct Pattern**: `kisaan_*`
- `kisaan_users` ✅
- `kisaan_shops` ✅  
- `kisaan_categories` ✅
- `kisaan_products` ✅
- `kisaan_transactions` ✅
- `kisaan_payments` ✅
- `kisaan_plans` ✅
- `kisaan_shop_categories` ✅
- `kisaan_commissions` ✅
- `kisaan_credits` ✅

❌ **Incorrect Pattern**:
- `settlements` → Should be `kisaan_settlements`
- `shop_products` → Should be `kisaan_shop_products`

## Database Schema & Relationships

### Core Entities

#### 1. Users (`kisaan_users`)
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- username (STRING, UNIQUE, NOT NULL)
- password (STRING, NOT NULL)
- role (ENUM: superadmin, owner, farmer, buyer)
- owner_id (STRING, NULL for superadmin/owner)
- shop_id (INTEGER, FK to kisaan_shops.id)
- contact, email (STRING, NULLABLE)
- status (ENUM: active, inactive, DEFAULT: active)
- balance (DECIMAL(12,2), DEFAULT: 0.00)
- created_by (INTEGER, FK to kisaan_users.id)
- created_at, updated_at (TIMESTAMP)
```

#### 2. Plans (`kisaan_plans`)
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- name (STRING(100), UNIQUE, NOT NULL)
- description (TEXT, NULLABLE)
- monthly_price, quarterly_price, yearly_price (DECIMAL(10,2))
- max_farmers, max_buyers, max_transactions (INTEGER)
- data_retention_months (INTEGER)
- features (TEXT, JSON string, DEFAULT: '[]')
- status (STRING)
- created_at, updated_at (TIMESTAMP)
```

#### 3. Shops (`kisaan_shops`)
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- name (STRING, NOT NULL)
- owner_id (STRING, NOT NULL, FK to kisaan_users.owner_id)
- category_id (INTEGER, FK to kisaan_categories.id) -- DEPRECATED
- plan_id (INTEGER, FK to kisaan_plans.id)
- address (TEXT)
- contact (STRING)
- commission_rate (DECIMAL(5,2), DEFAULT: 10.00)
- status (ENUM: active, inactive, DEFAULT: active)
- createdAt, updatedAt (TIMESTAMP)
```

#### 4. Categories (`kisaan_categories`)
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- name (STRING(100), UNIQUE, NOT NULL)
- description (TEXT)
- status (STRING)
- created_at, updated_at (TIMESTAMP)
```

#### 5. Products (`kisaan_products`)
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- name (STRING(100), NOT NULL)
- category_id (INTEGER, NOT NULL, FK to kisaan_categories.id)
- description (TEXT)
- price (DECIMAL(10,2))
- shop_id (INTEGER) -- DEPRECATED, use shop_products junction
- record_status (STRING)
- unit (STRING(20))
- created_at, updated_at (TIMESTAMP)
```

### Junction Tables

#### 6. Shop Categories (`kisaan_shop_categories`)
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- shop_id (INTEGER, NOT NULL, FK to kisaan_shops.id)
- category_id (INTEGER, NOT NULL, FK to kisaan_categories.id)
- is_active (BOOLEAN, DEFAULT: true)
- created_at, updated_at (TIMESTAMP)
- UNIQUE(shop_id, category_id)
```

#### 7. Shop Products (`shop_products`) ❌ Should be `kisaan_shop_products`
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- shop_id (INTEGER, NOT NULL, FK to kisaan_shops.id)
- product_id (INTEGER, NOT NULL, FK to kisaan_products.id)
- is_active (BOOLEAN, DEFAULT: true)
- created_at, updated_at (TIMESTAMP)
```

### Transaction System

#### 8. Transactions (`kisaan_transactions`)
```sql
- id (PK, BIGINT, AUTO_INCREMENT)
- shop_id (BIGINT, NOT NULL, FK to kisaan_shops.id)
- farmer_id (BIGINT, NOT NULL, FK to kisaan_users.id) ❌ Type mismatch
- buyer_id (BIGINT, NOT NULL, FK to kisaan_users.id) ❌ Type mismatch
- category_id (BIGINT, NOT NULL, FK to kisaan_categories.id)
- product_name (STRING(255), NOT NULL)
- quantity (DECIMAL(12,2), NOT NULL)
- unit_price (DECIMAL(12,2), NOT NULL)
- total_sale_value (DECIMAL(12,2), NOT NULL)
- shop_commission (DECIMAL(12,2), NOT NULL)
- farmer_earning (DECIMAL(12,2), NOT NULL)
- created_at, updated_at (TIMESTAMP)
```

#### 9. Payments (`kisaan_payments`)
```sql
- id (PK, BIGINT, AUTO_INCREMENT)
- transaction_id (BIGINT, NOT NULL, FK to kisaan_transactions.id)
- payer_type (ENUM: BUYER, SHOP)
- payee_type (ENUM: SHOP, FARMER)
- amount (DECIMAL(12,2), NOT NULL)
- status (ENUM: PENDING, PAID, FAILED, DEFAULT: PENDING)
- payment_date (TIMESTAMP, NULLABLE)
- method (ENUM: CASH, BANK, UPI, OTHER)
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

### Supporting Tables

#### 10. Commissions (`kisaan_commissions`)
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- shop_id (INTEGER, NOT NULL, FK to kisaan_shops.id)
- rate (DECIMAL(5,2), NOT NULL)
- type (ENUM: percentage, fixed, DEFAULT: percentage)
- created_at, updated_at (TIMESTAMP)
```

#### 11. Credit Advances (`kisaan_credits`)
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- user_id (STRING, NOT NULL) ❌ Should FK to kisaan_users.id
- amount (DECIMAL(10,2), NOT NULL)
- issued_date, due_date (DATE, NOT NULL)
- repaid_amount (DECIMAL(10,2), DEFAULT: 0)
- status (ENUM: active, repaid, overdue, DEFAULT: active)
- created_at, updated_at (TIMESTAMP)
```

#### 12. Settlements (`settlements`) ❌ Should be `kisaan_settlements`
```sql
- id (PK, INTEGER, AUTO_INCREMENT)
- shop_id (INTEGER, NOT NULL)
- user_id (STRING, NOT NULL)
- user_type (ENUM: farmer, buyer)
- transaction_id (INTEGER, NULLABLE)
- amount (DECIMAL(10,2), NOT NULL)
- type (ENUM: overpayment, underpayment, settlement, expense, payment_received, payment_made)
- description (TEXT, NOT NULL)
- status (ENUM: pending, settled, DEFAULT: pending)
- settled_amount (DECIMAL(10,2), DEFAULT: 0)
- balance (DECIMAL(10,2), NOT NULL)
- settlement_date (TIMESTAMP, NULLABLE)
- created_at, updated_at (TIMESTAMP)
```

## Relationship Mapping

### Primary Relationships
1. **Plan → Shop** (1:N): `plans.id ← shops.plan_id`
2. **Category → Product** (1:N): `categories.id ← products.category_id`
3. **Shop ↔ Category** (M:N): `shops ↔ shop_categories ↔ categories`
4. **Shop ↔ Product** (M:N): `shops ↔ shop_products ↔ products`
5. **Transaction → Payment** (1:N): `transactions.id ← payments.transaction_id`

### Foreign Key Relationships
```
kisaan_shops.plan_id → kisaan_plans.id
kisaan_products.category_id → kisaan_categories.id
kisaan_shop_categories.shop_id → kisaan_shops.id
kisaan_shop_categories.category_id → kisaan_categories.id
kisaan_transactions.shop_id → kisaan_shops.id
kisaan_transactions.farmer_id → kisaan_users.id (via owner_id)
kisaan_transactions.buyer_id → kisaan_users.id (via owner_id)
kisaan_transactions.category_id → kisaan_categories.id
kisaan_payments.transaction_id → kisaan_transactions.id
kisaan_commissions.shop_id → kisaan_shops.id
```

## Critical Issues Requiring Fixes

### 1. Type Inconsistencies ❌
```typescript
// Transaction model - CRITICAL FIX NEEDED
interface TransactionAttributes {
  farmer_id: string; // ❌ Should be number
  buyer_id: string;  // ❌ Should be number
}

// User model - CRITICAL FIX NEEDED  
interface UserAttributes {
  balance?: number; // ❌ Conflicts with allowNull: false in schema
}
```

### 2. Table Naming ❌
- `settlements` → `kisaan_settlements`
- `shop_products` → `kisaan_shop_products`

### 3. Missing Foreign Keys ❌
```sql
-- ShopProducts missing FK references
shop_id INTEGER NOT NULL -- Should reference kisaan_shops.id
product_id INTEGER NOT NULL -- Should reference kisaan_products.id

-- CreditAdvance missing FK reference
user_id STRING NOT NULL -- Should reference kisaan_users.id
```

### 4. Missing Associations ❌
- Commission model not included in index.ts associations
- Settlement model uses old association pattern

### 5. Performance Issues ❌
- Missing composite index on `(transaction_id, status)` in payments
- Missing indexes on frequently queried fields

## Architecture Assessment

### ✅ Strengths
1. **Consistent Naming**: Most tables follow `kisaan_*` pattern
2. **Clean Transaction Model**: Proper separation of transactions and payments
3. **Normalized Design**: Good separation of concerns
4. **Proper Indexing**: Most models have appropriate indexes
5. **Type Safety**: Strong TypeScript interfaces

### ❌ Weaknesses
1. **Type Mismatches**: Critical inconsistencies between interfaces and schemas
2. **Incomplete Associations**: Missing relationships in index.ts
3. **Table Naming**: Two tables don't follow naming convention
4. **Foreign Key Issues**: Missing proper references
5. **Performance Gaps**: Missing composite indexes

## Recommendations

### Immediate Fixes Required:
1. Fix type mismatches in Transaction and User models
2. Rename `settlements` and `shop_products` tables
3. Add missing foreign key references
4. Complete associations in index.ts
5. Add composite indexes for performance

### Architecture Validation:
The core business logic makes sense:
- Shops can sell products from assigned categories
- Transactions record sales with auto-calculated commissions
- Payments track actual cash flow separately
- Clean separation between transaction recording and payment processing

The model relationships support the KisaanCenter marketplace concept effectively.