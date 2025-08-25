# Market Management System - Database Schema

## 🗄️ **Complete Database Schema Documentation**

This document contains the comprehensive database schema for the Market Management System, including all tables, relationships, constraints, and indexes.

---

## Core Tables

### USER
```sql
CREATE TABLE USER (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'farmer', 'buyer', 'employee', 'guest') NOT NULL,
    shop_id INTEGER REFERENCES SHOP(id),
    created_by INTEGER REFERENCES USER(id),
    contact VARCHAR(255),
    credit_limit DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
);
```

### SHOP
```sql
CREATE TABLE SHOP (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    location VARCHAR(255),
    plan_id INTEGER REFERENCES PLAN(id),
    created_by INTEGER REFERENCES USER(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### PRODUCT
```sql
CREATE TABLE PRODUCT (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES SHOP(id),
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES CATEGORY(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### CATEGORY
```sql
CREATE TABLE CATEGORY (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL -- flower, vegetable, fruit, grain, etc.
);
```

### FARMER_STOCK
```sql
CREATE TABLE FARMER_STOCK (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES SHOP(id),
    farmer_user_id INTEGER REFERENCES USER(id),
    product_id INTEGER REFERENCES PRODUCT(id),
    quantity DECIMAL(10,3) NOT NULL,
    status ENUM('active', 'closed', 'discarded', 'returned') DEFAULT 'active',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TRANSACTION
```sql
CREATE TABLE TRANSACTION (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES SHOP(id),
    buyer_user_id INTEGER REFERENCES USER(id), -- nullable for guest
    parent_transaction_id INTEGER REFERENCES TRANSACTION(id), -- for returns/exchanges
    type ENUM('sale', 'return', 'exchange') DEFAULT 'sale',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TRANSACTION_ITEM
```sql
CREATE TABLE TRANSACTION_ITEM (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES TRANSACTION(id),
    product_id INTEGER REFERENCES PRODUCT(id),
    farmer_stock_id INTEGER REFERENCES FARMER_STOCK(id),
    quantity DECIMAL(10,3) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'refunded') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### CREDIT & CREDIT_DETAIL
```sql
CREATE TABLE CREDIT (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES TRANSACTION(id),
    buyer_user_id INTEGER REFERENCES USER(id),
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'partial', 'cleared') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CREDIT_DETAIL (
    id SERIAL PRIMARY KEY,
    credit_id INTEGER REFERENCES CREDIT(id),
    farmer_user_id INTEGER REFERENCES USER(id),
    product_id INTEGER REFERENCES PRODUCT(id),
    quantity DECIMAL(10,3) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### PAYMENT
```sql
CREATE TABLE PAYMENT (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES TRANSACTION(id), -- nullable if standalone
    credit_id INTEGER REFERENCES CREDIT(id), -- nullable if repayment of credit
    amount DECIMAL(10,2) NOT NULL,
    payment_method_id INTEGER REFERENCES PAYMENT_METHOD(id),
    type ENUM('full', 'partial', 'credit') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### FARMER_PAYMENT
```sql
CREATE TABLE FARMER_PAYMENT (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES TRANSACTION(id), -- nullable for advances
    farmer_stock_id INTEGER REFERENCES FARMER_STOCK(id), -- nullable for advances
    farmer_user_id INTEGER REFERENCES USER(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_type ENUM('advance', 'settlement') NOT NULL,
    payment_method_id INTEGER REFERENCES PAYMENT_METHOD(id),
    remarks TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### COMMISSION_RULE
```sql
CREATE TABLE COMMISSION_RULE (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES SHOP(id),
    product_id INTEGER REFERENCES PRODUCT(id),
    rule_type ENUM('flat', 'slab') NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    min_qty DECIMAL(10,3), -- for slab
    max_qty DECIMAL(10,3), -- for slab
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Supporting Tables

### STOCK_ADJUSTMENT
```sql
CREATE TABLE STOCK_ADJUSTMENT (
    id SERIAL PRIMARY KEY,
    farmer_stock_id INTEGER REFERENCES FARMER_STOCK(id),
    adjustment_qty DECIMAL(10,3) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    performed_by INTEGER REFERENCES USER(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### EXPENSE
```sql
CREATE TABLE EXPENSE (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES SHOP(id),
    expense_category_id INTEGER REFERENCES EXPENSE_CATEGORY(id),
    amount DECIMAL(10,2) NOT NULL,
    remarks TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### AUDIT_LOG
```sql
CREATE TABLE AUDIT_LOG (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES SHOP(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES USER(id),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Reference Tables

### PLAN & PLAN_FEATURE
```sql
CREATE TABLE PLAN (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE PLAN_FEATURE (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES PLAN(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### EXPENSE_CATEGORY
```sql
CREATE TABLE EXPENSE_CATEGORY (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL -- wage, rent, utility, other
);
```

### PAYMENT_METHOD
```sql
CREATE TABLE PAYMENT_METHOD (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- cash, online, upi, card, cheque
);
```

### PRODUCT_PRICE_HISTORY
```sql
CREATE TABLE PRODUCT_PRICE_HISTORY (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES PRODUCT(id),
    reference_price DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) -- market, govt, mandi
);
```

---

## Performance Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_transaction_shop_date ON TRANSACTION(shop_id, date);
CREATE INDEX idx_farmer_stock_status ON FARMER_STOCK(status, shop_id);
CREATE INDEX idx_credit_detail_buyer_farmer ON CREDIT_DETAIL(buyer_user_id, farmer_user_id);
CREATE INDEX idx_audit_log_entity ON AUDIT_LOG(entity_type, entity_id);
CREATE INDEX idx_user_role_shop ON USER(role, shop_id);
CREATE INDEX idx_transaction_item_farmer_stock ON TRANSACTION_ITEM(farmer_stock_id);
CREATE INDEX idx_payment_status ON PAYMENT(status, date);
CREATE INDEX idx_farmer_payment_type ON FARMER_PAYMENT(payment_type, farmer_user_id);
```

---

## Data Constraints & Business Rules

### Key Constraints:
1. **USER.credit_limit** - Only applies to buyers, must be >= 0
2. **FARMER_STOCK.quantity** - Must be > 0 when status = 'active'
3. **TRANSACTION.commission_rate** - Must be between 0 and 100
4. **CREDIT.amount** - Must be > 0
5. **PAYMENT.amount** - Must be > 0

### Business Rules:
1. **Guest Users** - Created per shop, username format: `GUEST_{shop_id}_{timestamp}`
2. **Credit Limit Check** - Before credit transaction, verify: `buyer_outstanding + new_credit <= credit_limit`
3. **Stock Validation** - Before sale, ensure: `farmer_stock.quantity >= transaction_item.quantity`
4. **Commission Storage** - Store commission_rate and commission_amount at transaction time for historical accuracy
5. **Audit Trail** - Log all CUD operations in AUDIT_LOG with before/after JSON data

---

## ENUMs Reference

| Table | Field | Values |
|-------|--------|---------|
| USER | role | owner, farmer, buyer, employee, guest |
| USER | status | active, inactive, suspended |
| FARMER_STOCK | status | active, closed, discarded, returned |
| TRANSACTION | type | sale, return, exchange |
| TRANSACTION | status | pending, completed, cancelled |
| PAYMENT | type | full, partial, credit |
| PAYMENT | status | pending, completed, failed, refunded |
| FARMER_PAYMENT | payment_type | advance, settlement |
| COMMISSION_RULE | rule_type | flat, slab |

This schema supports all business requirements including credit per farmer, partial payments, commission management, stock tracking, and complete audit trails.
