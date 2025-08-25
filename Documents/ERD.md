
# Entity Relationship Diagram (ERD) - Market Management System

```mermaid
erDiagram
            SUPERADMIN ||--o{ USER : creates
            SUPERADMIN ||--o{ SHOP : creates
            SUPERADMIN ||--o{ PLAN : assigns

            USER ||--o{ SHOP : manages
            USER ||--o{ TRANSACTION : initiates
            USER ||--o{ CREDIT : owes
            USER ||--o{ FARMER_PAYMENT : receives
            USER ||--o{ FARMER_STOCK : delivers

            SHOP ||--o{ PRODUCT : offers
            SHOP ||--o{ TRANSACTION : records
            SHOP ||--o{ EXPENSE : incurs
            SHOP ||--o{ FARMER_STOCK : receives
            SHOP ||--o{ AUDIT_LOG : logs
            SHOP ||--o{ COMMISSION_RULE : configures
            SHOP ||--o{ STOCK_ADJUSTMENT : adjusts

            PRODUCT ||--o{ CATEGORY : categorized_as
            PRODUCT ||--o{ PRODUCT_PRICE_HISTORY : has
            PRODUCT ||--o{ TRANSACTION_ITEM : referenced_in

            FARMER_STOCK ||--o{ PRODUCT : for
            FARMER_STOCK ||--o{ TRANSACTION_ITEM : source
            FARMER_STOCK ||--o{ STOCK_ADJUSTMENT : adjusted_by

            TRANSACTION ||--o{ TRANSACTION_ITEM : has
            TRANSACTION ||--o{ PAYMENT : has
            TRANSACTION ||--o{ CREDIT : creates
            TRANSACTION ||--o{ FARMER_PAYMENT : settled_by
            TRANSACTION ||--o{ AUDIT_LOG : logs
      TRANSACTION ||--o{ TRANSACTION : parent

            CREDIT ||--o{ CREDIT_DETAIL : details
            CREDIT ||--o{ PAYMENT : repaid_by

            PAYMENT ||--o{ AUDIT_LOG : logs
            FARMER_PAYMENT ||--o{ AUDIT_LOG : logs
            CREDIT ||--o{ AUDIT_LOG : logs
            CREDIT_DETAIL ||--o{ AUDIT_LOG : logs

            COMMISSION_RULE ||--o{ PRODUCT : applies_to
            COMMISSION_RULE ||--o{ SHOP : applies_to

            EXPENSE_CATEGORY ||--o{ EXPENSE : categorizes
            PLAN ||--o{ PLAN_FEATURE : has

            USER {
                  int id
                  string username
                  string password_hash
                  string role
                  int shop_id
                  int created_by
                  string contact
                  decimal credit_limit
                  datetime created_at
                  datetime updated_at
                  string status
            }

            CREDIT {
                  int id
                  int transaction_id
                  int buyer_user_id
                  decimal amount
                  datetime due_date
                  string status
                  datetime created_at
                  datetime updated_at
            }

            CREDIT_DETAIL {
                  int id
                  int credit_id
                  int farmer_user_id
                  int product_id
                  decimal quantity
                  decimal price
                  datetime date
                  datetime created_at
                  datetime updated_at
            }

            FARMER_PAYMENT {
                  int id
                  int transaction_id
                  int farmer_stock_id
                  int farmer_user_id
                  decimal amount
                  string payment_type
                  int payment_method_id
                  string remarks
                  datetime date
                  datetime created_at
                  datetime updated_at
            }

            TRANSACTION {
                  int id
                  int shop_id
                  int buyer_user_id
                  int parent_transaction_id
                  string type
                  string status
                  decimal commission_rate
                  decimal commission_amount
                  string payment_status
                  datetime date
                  datetime created_at
                  datetime updated_at
            }

            TRANSACTION_ITEM {
                  int id
                  int transaction_id
                  int product_id
                  int farmer_stock_id
                  decimal quantity
                  decimal price
                  string status
                  datetime created_at
                  datetime updated_at
            }

            STOCK_ADJUSTMENT {
                  int id
                  int farmer_stock_id
                  decimal adjustment_qty
                  string reason
                  int performed_by
                  datetime created_at
                  datetime updated_at
            }

            PAYMENT {
                  int id
                  int transaction_id
                  int credit_id
                  decimal amount
                  int payment_method_id
                  string type
                  string status
                  datetime date
                  datetime created_at
                  datetime updated_at
            }

            FARMER_STOCK {
                  int id
                  int shop_id
                  int farmer_user_id
                  int product_id
                  decimal quantity
                  string status
                  datetime date
                  datetime created_at
                  datetime updated_at
            }

            COMMISSION_RULE {
                  int id
                  int shop_id
                  int product_id
                  string rule_type
                  decimal rate
                  decimal min_qty
                  decimal max_qty
                  datetime created_at
                  datetime updated_at
            }

            AUDIT_LOG {
                  int id
                  int shop_id
                  string entity_type
                  int entity_id
                  int user_id
                  json old_data
                  json new_data
                  datetime created_at
            }

            EXPENSE {
                  int id
                  int shop_id
                  int category_id
                  decimal amount
                  string remarks
                  datetime date
                  datetime created_at
                  datetime updated_at
            }

            EXPENSE_CATEGORY {
                  int id
                  string name
            }

            PLAN {
                  int id
                  string name
                  decimal price
                  bool active
                  datetime created_at
                  datetime updated_at
            }

            PLAN_FEATURE {
                  int id
                  int plan_id
                  string feature_key
                  bool enabled
            }

            PRODUCT_PRICE_HISTORY {
                  int id
                  int product_id
                  decimal reference_price
                  datetime effective_from
                  datetime effective_to
            }

            CATEGORY {
                  int id
                  string name
            }

            PRODUCT {
                  int id
                  int shop_id
                  int category_id
                  string name
                  string unit
                  string description
                  bool status
            }

            SUPERADMIN {
                  int id
                  string username
                  string password_hash
                  string contact
                  datetime created_at
                  datetime updated_at
                  string status
            }

            SHOP {
                  int id
                  int owner_user_id
                  int created_by
                  int plan_id
                  string name
                  string address
                  datetime created_at
                  datetime updated_at
                  string status
            }
```

---

# Owner Workflow Diagram

```mermaid
flowchart TD
      %% Farmer Flow
      FA[Farmer delivers products] --> FB[Farmer stock recorded]
      FB --> FC[Net quantity calculated]
      FC --> FD[Products available for sale]
      FD --> FE[Farmer checks stock and sales]
      FE --> FF[Farmer requests payment]
      FF --> FG[Shop pays farmer advance or settlement]
      FG --> FH[Farmer receives payment]
      FC --> FS[Stock closed/returned/discarded]
      FS --> SA[Stock adjustment if needed]

      %% Buyer Flow
      BA[Buyer views available products] --> BB[Buyer selects products]
      BB --> BC[Buyer purchases products]
      BC --> BD[Transaction recorded]
      BD --> BE[Buyer makes payment]
      BE --> BF[Shop receives payment]
      BF --> BG[Buyer receives receipt]
      BC -.-> BM[Partial payment or credit to buyer]
      BM --> BF
      BD --> CL[Credit ledger updated]

      %% Owner Flow
      OA[Owner reviews deliveries] --> OB[Owner reviews stock]
      OB --> OC[Owner reviews sales]
      OC --> OD[Owner reviews payments]
      OD --> OE[Owner reviews expenses]
      OE --> OF[Owner reviews reports]
      OC --> OL[Owner reviews buyer/farmer ledgers]

      %% Shared Steps
      FC --> BD
      FG --> OD
      BF --> OD
      FS --> OE

      %% Edge cases
      BD -.-> O1[Audit log for transaction edits]
      FH -.-> O2[Audit log for payment edits]
      FB -.-> O3[Audit log for stock edits]
      FG -.-> O4[Audit log for farmer payment edits]
      CL -.-> O5[Audit log for credit/credit detail edits]
      SA -.-> O6[Audit log for stock adjustment edits]

      %% Expenses
      OE --> O7[Shop expenses tracked]
      O7 --> OF
```

---

# Reference Tables & ENUMs Documentation

## Reference Tables

- **CATEGORY**: Product types (e.g., flower, vegetable, fruit, grain, etc.)
- **PAYMENT_METHOD**: Payment options (e.g., cash, online, upi, card, cheque, etc.)
- **PLAN**: Subscription or service tiers (e.g., basic, premium, enterprise)
- **EXPENSE_CATEGORY**: Expense categories for reporting/analytics

## ENUM Fields

- **USER.role**: 'owner', 'farmer', 'buyer', 'employee', 'guest'
- **USER.status**: 'active', 'inactive', 'suspended'
- **EXPENSE_CATEGORY.name**: e.g., 'wage', 'rent', 'utility', 'other'
- **TRANSACTION.type**: 'sale', 'return', 'exchange'
- **TRANSACTION.status**: 'pending', 'completed', 'cancelled'
- **FARMER_STOCK.status**: 'active', 'closed', 'discarded', 'returned'
- **PAYMENT.type**: 'full', 'partial', 'credit'
- **PAYMENT.status**: 'pending', 'completed', 'failed', 'refunded'
- **FARMER_PAYMENT.payment_type**: 'advance', 'settlement'
- **COMMISSION_RULE.rule_type**: 'flat', 'slab'

## Schema Clarifications & Improvements

- **FARMER_PAYMENT**: Supports both advances and settlements. Both transaction_id and farmer_stock_id are nullable to allow flexibility.
- **CREDIT_DETAIL**: Documents which farmer, product, quantity, price, and date for each credit entry. Enables detailed buyer ledger.
- **TRANSACTION.parent_transaction_id**: Supports returns and exchanges, linking related transactions.
- **COMMISSION_RULE**: Supports flat and slab commission rates, with min/max quantity for slabs.
- **STOCK_ADJUSTMENT**: Logs all stock corrections, with reason and performed_by.
- **USER.credit_limit**: Buyer credit cap, triggers alerts if exceeded.
- **Audit Log**: Extended to FARMER_PAYMENT, CREDIT, CREDIT_DETAIL, STOCK_ADJUSTMENT for full traceability.
- **Guest Buyers**: Use a default GUEST_BUYER per shop for walk-ins; if registered, a new user is created (no merging).
- **Buyer Ledger**: Shows all purchases on credit (farmer, product, qty, price, date), all payments, balance over time, and alerts for credit limit.
- **Farmer Ledger**: History of advances, sales, settlements, and outstanding dues.

This documentation ensures all types and options are standardized, dispute-ready, and future-proofed for implementation.
