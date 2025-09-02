
# KisaanCenter Database Schema - Consolidated & API-Aligned

Robust database schema with consolidated tables, proper enums, and API field alignment.

---

## ENUMS DEFINED

- **user_role**: 'superadmin', 'owner', 'manager', 'employee', 'farmer', 'buyer'
- **record_status**: 'active', 'inactive', 'deleted'
- **transaction_status**: 'pending', 'completed', 'cancelled'
- **transaction_type**: 'sale', 'purchase', 'return'
- **payment_status**: 'unpaid', 'paid', 'partial'
- **payment_type**: 'cash', 'card', 'upi', 'bank_transfer'
- **farmer_payment_type**: 'advance', 'final', 'bonus'
- **credit_status**: 'pending', 'approved', 'rejected', 'paid'
- **completion_status**: 'pending', 'in_progress', 'complete'
- **stock_status**: 'in_stock', 'out_of_stock', 'low_stock'
- **subscription_status**: 'active', 'inactive', 'cancelled', 'expired'
- **billing_cycle**: 'monthly', 'quarterly', 'yearly'

---


## CORE TABLES

### categories
- id SERIAL PRIMARY KEY
- name VARCHAR(100) NOT NULL UNIQUE
- description TEXT
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### shops
- id SERIAL PRIMARY KEY
- name VARCHAR(100) NOT NULL
- address TEXT
- location VARCHAR(255)
- contact VARCHAR(15)
- commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00
- owner_user_id INTEGER → REFERENCES users(id)
- plan_id INTEGER → REFERENCES plans(id)
- plan_start_date DATE
- plan_end_date DATE
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### users
- id SERIAL PRIMARY KEY
- username VARCHAR(50) NOT NULL UNIQUE
- password_hash VARCHAR(255) NOT NULL
- role user_role NOT NULL
- contact VARCHAR(15)
- shop_id INTEGER → REFERENCES shops(id)
- credit_limit DECIMAL(12,2) DEFAULT 0.00
- status record_status NOT NULL DEFAULT 'active'
- created_by INTEGER → REFERENCES users(id)
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### superadmin
- id SERIAL PRIMARY KEY
- username VARCHAR(50) NOT NULL UNIQUE
- password_hash VARCHAR(255) NOT NULL
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### user_activity
- id SERIAL PRIMARY KEY
- user_id INTEGER NOT NULL → REFERENCES users(id)
- activity VARCHAR(255) NOT NULL
- details TEXT
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### products
- id SERIAL PRIMARY KEY
- name VARCHAR(100) NOT NULL
- description TEXT
- category_id INTEGER NOT NULL → REFERENCES categories(id)
- price DECIMAL(10,2)
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### farmer_stock
- id SERIAL PRIMARY KEY
- farmer_user_id INTEGER NOT NULL → REFERENCES users(id)
- product_id INTEGER NOT NULL → REFERENCES products(id)
- quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000
- price DECIMAL(10,2) NOT NULL
- status stock_status NOT NULL DEFAULT 'in_stock'
- record_status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

---

## TRANSACTION TABLES

### transactions
- id SERIAL PRIMARY KEY
- shop_id INTEGER NOT NULL → REFERENCES shops(id)
- buyer_id INTEGER NOT NULL → REFERENCES users(id)
- parent_transaction_id INTEGER → REFERENCES transactions(id)
- type transaction_type NOT NULL DEFAULT 'sale'
- status transaction_status NOT NULL DEFAULT 'pending'
- commission_rate DECIMAL(5,2) DEFAULT 0.00
- commission_amount DECIMAL(12,2) DEFAULT 0.00
- payment_status payment_status NOT NULL DEFAULT 'unpaid'
- buyer_paid_amount DECIMAL(12,2) DEFAULT 0.00
- farmer_paid_amount DECIMAL(12,2) DEFAULT 0.00
- commission_confirmed BOOLEAN DEFAULT false
- completion_status completion_status NOT NULL DEFAULT 'pending'
- date DATE NOT NULL
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### transaction_items
- id SERIAL PRIMARY KEY
- transaction_id INTEGER NOT NULL → REFERENCES transactions(id)
- product_id INTEGER NOT NULL → REFERENCES products(id)
- farmer_id INTEGER NOT NULL → REFERENCES users(id)
- farmer_stock_id INTEGER → REFERENCES farmer_stock(id)
- quantity DECIMAL(10,3) NOT NULL
- price DECIMAL(10,2) NOT NULL
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

---

## PAYMENT TABLES

### payment_methods
- id SERIAL PRIMARY KEY
- name VARCHAR(50) NOT NULL UNIQUE
- description TEXT
- is_active BOOLEAN DEFAULT true
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### credits
- id SERIAL PRIMARY KEY
- user_id INTEGER NOT NULL → REFERENCES users(id)
- amount DECIMAL(12,2) NOT NULL
- status credit_status NOT NULL DEFAULT 'pending'
- record_status record_status NOT NULL DEFAULT 'active'
- address TEXT
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### payments
- id SERIAL PRIMARY KEY
- transaction_id INTEGER NOT NULL → REFERENCES transactions(id)
- credit_id INTEGER → REFERENCES credits(id)
- amount DECIMAL(12,2) NOT NULL
- payment_method_id INTEGER NOT NULL → REFERENCES payment_methods(id)
- type payment_type NOT NULL
- status record_status DEFAULT 'active'
- date DATE NOT NULL
- reference_number VARCHAR(100)
- notes TEXT
- processed_by INTEGER → REFERENCES users(id)
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### farmer_payments
- id SERIAL PRIMARY KEY
- transaction_id INTEGER NOT NULL → REFERENCES transactions(id)
- farmer_stock_id INTEGER → REFERENCES farmer_stock(id)
- farmer_user_id INTEGER NOT NULL → REFERENCES users(id)
- amount DECIMAL(12,2) NOT NULL
- payment_type farmer_payment_type NOT NULL
- payment_method_id INTEGER NOT NULL → REFERENCES payment_methods(id)
- remarks TEXT
- date DATE NOT NULL
- reference_number VARCHAR(100)
- approved_by INTEGER → REFERENCES users(id)
- status record_status DEFAULT 'active'
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

---

## SUBSCRIPTION TABLES

### plans
- id SERIAL PRIMARY KEY
- name VARCHAR(100) NOT NULL
- description TEXT
- monthly_price DECIMAL(10,2) NOT NULL
- quarterly_price DECIMAL(10,2)
- yearly_price DECIMAL(10,2)
- max_farmers INTEGER NOT NULL
- max_buyers INTEGER NOT NULL
- max_transactions INTEGER NOT NULL
- data_retention_months INTEGER NOT NULL
- features JSONB
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### subscriptions
- id SERIAL PRIMARY KEY
- shop_id INTEGER NOT NULL → REFERENCES shops(id)
- plan_id INTEGER NOT NULL → REFERENCES plans(id)
- billing_cycle billing_cycle NOT NULL DEFAULT 'monthly'
- auto_renew BOOLEAN DEFAULT true
- start_date DATE
- end_date DATE
- status subscription_status NOT NULL DEFAULT 'active'
- payment_status payment_status NOT NULL DEFAULT 'unpaid'
- amount DECIMAL(10,2)
- discount_amount DECIMAL(10,2)
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### feature_control
- id SERIAL PRIMARY KEY
- shop_id INTEGER NOT NULL → REFERENCES shops(id)
- feature_name VARCHAR(100) NOT NULL
- is_enabled BOOLEAN DEFAULT true
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

---

## AUDIT TABLE

### farmer_stock_audit
- id SERIAL PRIMARY KEY
- farmer_stock_id INTEGER NOT NULL → REFERENCES farmer_stock(id)
- performed_by_id INTEGER NOT NULL → REFERENCES users(id)
- action_type VARCHAR(50) NOT NULL
- old_values JSONB
- new_values JSONB
- transaction_id INTEGER → REFERENCES transactions(id)
- notes TEXT
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

---

## KEY IMPROVEMENTS

✅ **Eliminated Duplicates**: Removed duplicate tables (credit/credits, payment/payments, etc.)
✅ **Added Missing Tables**: categories, farmer_stock, shops, users, superadmin, user_activity
✅ **Defined All Enums**: Proper PostgreSQL enum types for all status fields
✅ **API Field Alignment**: buyer_id (not buyer_user_id), farmer_id in transaction_items
✅ **Complete Foreign Keys**: All relationships properly defined with constraints
✅ **Performance Indexes**: Added indexes on frequently queried fields
✅ **Default Data**: Inserted essential categories and payment methods

**Migration File**: `006_schema_consolidation_and_fixes.sql`

### superadmin
- id SERIAL PRIMARY KEY
- username VARCHAR(50) NOT NULL UNIQUE
- password_hash VARCHAR(255) NOT NULL
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### user_activity
- id SERIAL PRIMARY KEY
- user_id INTEGER NOT NULL → REFERENCES users(id)
- activity VARCHAR(255) NOT NULL
- details TEXT
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### products
- id SERIAL PRIMARY KEY
- name VARCHAR(100) NOT NULL
- description TEXT
- category_id INTEGER NOT NULL → REFERENCES categories(id)
- price DECIMAL(10,2)
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### farmer_stock
- id SERIAL PRIMARY KEY
- farmer_user_id INTEGER NOT NULL → REFERENCES users(id)
- product_id INTEGER NOT NULL → REFERENCES products(id)
- quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000
- price DECIMAL(10,2) NOT NULL
- status stock_status NOT NULL DEFAULT 'in_stock'
- record_status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

---

## TRANSACTION TABLES

### transactions
- id SERIAL PRIMARY KEY
- shop_id INTEGER NOT NULL → REFERENCES shops(id)
- **buyer_id** INTEGER NOT NULL → REFERENCES users(id) *(API-aligned field name)*
- parent_transaction_id INTEGER → REFERENCES transactions(id)
- type transaction_type NOT NULL DEFAULT 'sale'
- status transaction_status NOT NULL DEFAULT 'pending'
- commission_rate DECIMAL(5,2) DEFAULT 0.00
- commission_amount DECIMAL(12,2) DEFAULT 0.00
- payment_status payment_status NOT NULL DEFAULT 'unpaid'
- buyer_paid_amount DECIMAL(12,2) DEFAULT 0.00
- farmer_paid_amount DECIMAL(12,2) DEFAULT 0.00
- commission_confirmed BOOLEAN DEFAULT false
- completion_status completion_status NOT NULL DEFAULT 'pending'
- date DATE NOT NULL
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### transaction_items
- id SERIAL PRIMARY KEY
- transaction_id INTEGER NOT NULL → REFERENCES transactions(id)
- product_id INTEGER NOT NULL → REFERENCES products(id)
- **farmer_id** INTEGER NOT NULL → REFERENCES users(id) *(API-aligned field name)*
- farmer_stock_id INTEGER → REFERENCES farmer_stock(id)
- quantity DECIMAL(10,3) NOT NULL
- price DECIMAL(10,2) NOT NULL
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

---

## PAYMENT TABLES

### payment_methods
- id SERIAL PRIMARY KEY
- name VARCHAR(50) NOT NULL UNIQUE
- description TEXT
- is_active BOOLEAN DEFAULT true
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### credits
- id SERIAL PRIMARY KEY
- user_id INTEGER NOT NULL → REFERENCES users(id)
- amount DECIMAL(12,2) NOT NULL
- status credit_status NOT NULL DEFAULT 'pending'
- record_status record_status NOT NULL DEFAULT 'active'
- address TEXT
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### payments
- id SERIAL PRIMARY KEY
- transaction_id INTEGER NOT NULL → REFERENCES transactions(id)
- credit_id INTEGER → REFERENCES credits(id)
- amount DECIMAL(12,2) NOT NULL
- payment_method_id INTEGER NOT NULL → REFERENCES payment_methods(id)
- type payment_type NOT NULL
- status record_status DEFAULT 'active'
- date DATE NOT NULL
- reference_number VARCHAR(100)
- notes TEXT
- processed_by INTEGER → REFERENCES users(id)
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### farmer_payments
- id SERIAL PRIMARY KEY
- transaction_id INTEGER NOT NULL → REFERENCES transactions(id)
- farmer_stock_id INTEGER → REFERENCES farmer_stock(id)
- farmer_user_id INTEGER NOT NULL → REFERENCES users(id)
- amount DECIMAL(12,2) NOT NULL
- payment_type farmer_payment_type NOT NULL
- payment_method_id INTEGER NOT NULL → REFERENCES payment_methods(id)
- remarks TEXT
- date DATE NOT NULL
- reference_number VARCHAR(100)
- approved_by INTEGER → REFERENCES users(id)
- status record_status DEFAULT 'active'
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

---

## SUBSCRIPTION TABLES

### plans
- id SERIAL PRIMARY KEY
- name VARCHAR(100) NOT NULL
- description TEXT
- monthly_price DECIMAL(10,2) NOT NULL
- quarterly_price DECIMAL(10,2)
- yearly_price DECIMAL(10,2)
- max_farmers INTEGER NOT NULL
- max_buyers INTEGER NOT NULL
- max_transactions INTEGER NOT NULL
- data_retention_months INTEGER NOT NULL
- features JSONB
- status record_status NOT NULL DEFAULT 'active'
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

### subscriptions
- id SERIAL PRIMARY KEY
- shop_id INTEGER NOT NULL → REFERENCES shops(id)
- plan_id INTEGER NOT NULL → REFERENCES plans(id)
- billing_cycle billing_cycle NOT NULL DEFAULT 'monthly'
- auto_renew BOOLEAN DEFAULT true
- start_date DATE
- end_date DATE
- status subscription_status NOT NULL DEFAULT 'active'
- payment_status payment_status NOT NULL DEFAULT 'unpaid'
- amount DECIMAL(10,2)
- discount_amount DECIMAL(10,2)
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### feature_control
- id SERIAL PRIMARY KEY
- shop_id INTEGER NOT NULL → REFERENCES shops(id)
- feature_name VARCHAR(100) NOT NULL
- is_enabled BOOLEAN DEFAULT true
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

---

## AUDIT TABLE

### farmer_stock_audit
- id SERIAL PRIMARY KEY
- farmer_stock_id INTEGER NOT NULL → REFERENCES farmer_stock(id)
- performed_by_id INTEGER NOT NULL → REFERENCES users(id)
- action_type VARCHAR(50) NOT NULL
- old_values JSONB
- new_values JSONB
- transaction_id INTEGER → REFERENCES transactions(id)
- notes TEXT
- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

---

## KEY IMPROVEMENTS

✅ **Eliminated Duplicates**: Removed duplicate tables (credit/credits, payment/payments, etc.)
✅ **Added Missing Tables**: categories, farmer_stock, shops, users, superadmin, user_activity
✅ **Defined All Enums**: Proper PostgreSQL enum types for all status fields
✅ **API Field Alignment**: buyer_id (not buyer_user_id), farmer_id in transaction_items
✅ **Complete Foreign Keys**: All relationships properly defined with constraints
✅ **Performance Indexes**: Added indexes on frequently queried fields
✅ **Default Data**: Inserted essential categories and payment methods

**Migration File**: `006_schema_consolidation_and_fixes.sql`
