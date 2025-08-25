

# Entity Relationship Diagram (ERD) - Market Management System (Mermaid, Best Practices)



```mermaid
erDiagram
      TRANSACTION ||--o{ TRANSACTION_ITEM : has
      SUPERADMIN {
            int id
            string username
            string password_hash
            string contact
            datetime created_at
            datetime updated_at
            bool status
      }

      SUPERADMIN ||--o{ USER : creates
      SUPERADMIN ||--o{ SHOP : creates
      SUPERADMIN ||--o{ PLAN : assigns

      USER ||--o{ SHOP : manages
      USER ||--o{ FARMER : is
      USER ||--o{ BUYER : is
      USER ||--o{ EMPLOYEE : is
      SHOP ||--o{ FARMER : has
      SHOP ||--o{ BUYER : has
      SHOP ||--o{ PRODUCT : offers
      SHOP ||--o{ TRANSACTION : records
      SHOP ||--o{ EXPENSE : incurs
      SHOP ||--o{ FARMER_STOCK : receives
      SHOP ||--o{ AUDIT_LOG : logs
      FARMER ||--o{ TRANSACTION : makes
      BUYER ||--o{ TRANSACTION : buys
      PRODUCT ||--o{ TRANSACTION : included_in
      PRODUCT ||--o{ FARMER_STOCK : delivered
      PRODUCT ||--o{ CATEGORY : categorized_as
      TRANSACTION ||--o{ PAYMENT : has
      TRANSACTION ||--o{ AUDIT_LOG : logs
      PAYMENT ||--o{ AUDIT_LOG : logs

      FARMER_STOCK ||--o{ FARMER_STOCK_COMMENT : has

      FARMER_STOCK_COMMENT {
            int id
            int farmer_stock_id
            string comment
            datetime created_at
            int created_by
      }

      USER {
            int id
            string username
            string password_hash
            string role
            int shop_id
            int created_by_superadmin_id
            string contact
            datetime created_at
            datetime updated_at
            bool status
      }
      SHOP {
            int id
            int owner_user_id
            int created_by_superadmin_id
            int plan_id
            string name
            string address
            datetime created_at
            datetime updated_at
            bool status
      }
      FARMER {
            int id
            int user_id
            int shop_id
            string name
            string contact
            datetime created_at
            datetime updated_at
            bool status
      }
      BUYER {
            int id
            int user_id
            int shop_id
            string name
            string contact
            datetime created_at
            datetime updated_at
            bool status
      }
      EMPLOYEE {
            int id
            int user_id
            int shop_id
            string name
            string contact
            datetime created_at
            datetime updated_at
            bool status
      }
      PLAN {
            int id
            string name
            string features
            decimal price
            int max_users
            int max_products
            int max_transactions
            int max_shops
            bool advanced_analytics
            bool bulk_sms
            bool multi_region
            bool active
            datetime created_at
            datetime updated_at
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
            decimal price
            datetime created_at
            datetime updated_at
            bool status
      }
      FARMER_STOCK {
            int id
            int shop_id
            int farmer_id
            int product_id
            decimal gross_qty
            decimal sold_qty
            decimal unsold_qty
            decimal discarded_qty
            decimal net_qty
            datetime arrival_date
            string status
            int created_by
            datetime created_at
            datetime updated_at
      }

      TRANSACTION {
            int id
            int shop_id
            int farmer_id
            int buyer_id
            decimal commission_rate
            decimal commission_amount
            string payment_status
            datetime date
            bool paid_to_farmer
            datetime created_at
            datetime updated_at
      }

      TRANSACTION_ITEM {
            int id
            int transaction_id
            int product_id
            decimal quantity
            decimal price
      }
      PAYMENT {
            int id
            int transaction_id
            int farmer_id
            int buyer_id
            decimal amount
            decimal outstanding_amount
            string payment_type
            string method
            string remarks
            datetime date
            datetime created_at
            datetime updated_at
      }
      EXPENSE {
            int id
            int shop_id
            string type
            decimal amount
            datetime date
            string remarks
            int created_by
            datetime created_at
            datetime updated_at
      }
      AUDIT_LOG {
            int id
            string entity_type
            int entity_id
            string old_value
            string new_value
            int performed_by
            datetime timestamp
      }
```


---


# Owner Workflow Diagram (Mermaid)

```mermaid
flowchart TD
      %% Farmer Flow
      FA[Farmer delivers products] --> FB[Farmer stock recorded]
      FB --> FC[Net quantity calculated]
      FC --> FD[Products available for sale]
      FD --> FE[Farmer checks stock and sales]
      FE --> FF[Farmer requests payment]
      FF --> FG[Shop pays farmer minus commission]
      FG --> FH[Farmer receives payment]
      FC --> FS[Stock closed/returned/discarded]

      %% Buyer Flow
      BA[Buyer views available products] --> BB[Buyer selects products]
      BB --> BC[Buyer purchases products]
      BC --> BD[Transaction recorded]
      BD --> BE[Buyer makes payment]
      BE --> BF[Shop receives payment]
      BF --> BG[Buyer receives receipt]
      BC -.-> BM[Partial payment or credit to buyer]
      BM --> BF

      %% Owner Flow
      OA[Owner reviews deliveries] --> OB[Owner reviews stock]
      OB --> OC[Owner reviews sales]
      OC --> OD[Owner reviews payments]
      OD --> OE[Owner reviews expenses]
      OE --> OF[Owner reviews reports]

      %% Shared Steps
      FC --> BD
      FG --> OD
      BF --> OD
      FS --> OE

      %% Edge cases
      BD -.-> O1[Audit log for transaction edits]
      FH -.-> O2[Audit log for payment edits]
      FB -.-> O3[Audit log for stock edits]

      %% Expenses
      OE --> O4[Shop expenses tracked]
      O4 --> OF
```


---

# Reference Tables & ENUMs Documentation

## Reference Tables

- **CATEGORY**: Product types (e.g., flower, vegetable, fruit, grain, etc.)
- **PAYMENT_METHOD**: Payment options (e.g., cash, online, upi, card, cheque, etc.)
- **PLAN**: Subscription or service tiers (e.g., basic, premium, enterprise)

## ENUM Fields

- **USER.role**: 'owner', 'farmer', 'buyer', 'employee'
- **USER.status**: 'active', 'inactive', 'suspended'
- **EXPENSE.type**: 'wage', 'rent', 'utility', 'other'
- **TRANSACTION.type**: 'sale', 'return', 'exchange'
- **TRANSACTION.status**: 'pending', 'completed', 'cancelled'
- **FARMER_STOCK.status**: 'active', 'closed', 'discarded', 'returned'
- **PAYMENT.type**: 'full', 'partial', 'credit'
- **PAYMENT.status**: 'pending', 'completed', 'failed', 'refunded'

## Usage Notes

- Reference tables (CATEGORY, PAYMENT_METHOD, PLAN) should be used for normalization and reporting.
- ENUM fields should be implemented as database ENUM types or validated in application logic for consistency.
- Foreign keys should link entities to reference tables for integrity and easy filtering.

This documentation ensures all types and options are standardized and future-proofed for implementation.
