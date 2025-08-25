
# Market Management System - Entity Relationship Diagram

## 🎯 **ERD Overview**
This document contains the core Entity Relationship Diagram for the Market Management System, showing the relationships between all entities and their key attributes.

**📋 Related Documentation:**
- [Database Schema](./Database_Schema.md) - Complete SQL table definitions
- [Business Rules](./Business_Rules.md) - Business logic and validation rules  
- [System Architecture](./System_Architecture.md) - Technology stack and architecture
- [API Specification](./API_Specification.md) - REST API endpoints

---

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Core User Management
    SUPERADMIN ||--o{ USER : creates
    SUPERADMIN ||--o{ SHOP : creates
    SUPERADMIN ||--o{ PLAN : assigns

    %% Shop & User Relationships
    USER ||--o{ SHOP : manages
    USER ||--o{ TRANSACTION : initiates
    USER ||--o{ CREDIT : owes
    USER ||--o{ FARMER_PAYMENT : receives
    USER ||--o{ FARMER_STOCK : delivers

    %% Shop Operations
    SHOP ||--o{ PRODUCT : offers
    SHOP ||--o{ TRANSACTION : records
    SHOP ||--o{ EXPENSE : incurs
    SHOP ||--o{ FARMER_STOCK : receives
    SHOP ||--o{ AUDIT_LOG : logs
    SHOP ||--o{ COMMISSION_RULE : configures
    SHOP ||--o{ STOCK_ADJUSTMENT : adjusts

    %% Product Management
    PRODUCT ||--o{ CATEGORY : categorized_as
    PRODUCT ||--o{ PRODUCT_PRICE_HISTORY : has
    PRODUCT ||--o{ TRANSACTION_ITEM : referenced_in
    COMMISSION_RULE ||--o{ PRODUCT : applies_to

    %% Stock Management
    FARMER_STOCK ||--o{ PRODUCT : for
    FARMER_STOCK ||--o{ TRANSACTION_ITEM : source
    FARMER_STOCK ||--o{ STOCK_ADJUSTMENT : adjusted_by

    %% Transaction Flow
    TRANSACTION ||--o{ TRANSACTION_ITEM : has
    TRANSACTION ||--o{ PAYMENT : has
    TRANSACTION ||--o{ CREDIT : creates
    TRANSACTION ||--o{ FARMER_PAYMENT : settled_by
    TRANSACTION ||--o{ AUDIT_LOG : logs
    TRANSACTION ||--o{ TRANSACTION : parent

    %% Credit Management
    CREDIT ||--o{ CREDIT_DETAIL : details
    CREDIT ||--o{ PAYMENT : repaid_by

    %% Audit & Logging
    PAYMENT ||--o{ AUDIT_LOG : logs
    FARMER_PAYMENT ||--o{ AUDIT_LOG : logs
    CREDIT ||--o{ AUDIT_LOG : logs
    CREDIT_DETAIL ||--o{ AUDIT_LOG : logs

    %% Reference Data
    EXPENSE_CATEGORY ||--o{ EXPENSE : categorizes
    PLAN ||--o{ PLAN_FEATURE : has
    PAYMENT_METHOD ||--o{ PAYMENT : method
    PAYMENT_METHOD ||--o{ FARMER_PAYMENT : method

    %% Entity Definitions
    USER {
        int id PK
        string username UK
        string password_hash
        enum role
        int shop_id FK
        int created_by FK
        string contact
        decimal credit_limit
        datetime created_at
        datetime updated_at
        enum status
    }

    SHOP {
        int id PK
        string name UK
        string location
        int plan_id FK
        int created_by FK
        datetime created_at
        datetime updated_at
        enum status
    }

    PRODUCT {
        int id PK
        int shop_id FK
        string name
        int category_id FK
        datetime created_at
        datetime updated_at
        enum status
    }

    FARMER_STOCK {
        int id PK
        int shop_id FK
        int farmer_user_id FK
        int product_id FK
        decimal quantity
        enum status
        datetime date
        datetime created_at
        datetime updated_at
    }

    TRANSACTION {
        int id PK
        int shop_id FK
        int buyer_user_id FK
        int parent_transaction_id FK
        enum type
        enum status
        decimal commission_rate
        decimal commission_amount
        enum payment_status
        datetime date
        datetime created_at
        datetime updated_at
    }

    TRANSACTION_ITEM {
        int id PK
        int transaction_id FK
        int product_id FK
        int farmer_stock_id FK
        decimal quantity
        decimal price
        enum status
        datetime created_at
        datetime updated_at
    }

    CREDIT {
        int id PK
        int transaction_id FK
        int buyer_user_id FK
        decimal amount
        enum status
        datetime created_at
        datetime updated_at
    }

    CREDIT_DETAIL {
        int id PK
        int credit_id FK
        int farmer_user_id FK
        int product_id FK
        decimal quantity
        decimal price
        datetime date
        datetime created_at
        datetime updated_at
    }

    PAYMENT {
        int id PK
        int transaction_id FK
        int credit_id FK
        decimal amount
        int payment_method_id FK
        enum type
        enum status
        datetime date
        datetime created_at
        datetime updated_at
    }

    FARMER_PAYMENT {
        int id PK
        int transaction_id FK
        int farmer_stock_id FK
        int farmer_user_id FK
        decimal amount
        enum payment_type
        int payment_method_id FK
        string remarks
        datetime date
        datetime created_at
        datetime updated_at
    }

    COMMISSION_RULE {
        int id PK
        int shop_id FK
        int product_id FK
        enum rule_type
        decimal rate
        decimal min_qty
        decimal max_qty
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOG {
        int id PK
        int shop_id FK
        string entity_type
        int entity_id
        int user_id FK
        json old_data
        json new_data
        datetime created_at
    }
```

---

## System Workflow Overview

### Complete Business Process Flow
```mermaid
flowchart TD
    %% Farmer Operations
    F1[Farmer delivers products] --> F2[Stock recorded in FARMER_STOCK]
    F2 --> F3[Products available for sale]
    F3 --> F4[Farmer views stock status]
    F4 --> F5[Farmer requests payment]
    F5 --> F6[FARMER_PAYMENT recorded]

    %% Buyer Operations  
    B1[Buyer views available products] --> B2[Buyer selects items]
    B2 --> B3[TRANSACTION created]
    B3 --> B4[TRANSACTION_ITEM details]
    B4 --> B5{Payment Type?}
    
    B5 -->|Full Payment| B6[PAYMENT recorded]
    B5 -->|Credit| B7[CREDIT & CREDIT_DETAIL created]
    B6 --> B8[Transaction completed]
    B7 --> B9[Credit ledger updated]
    
    %% Credit Management
    B9 --> B10[Buyer makes partial payment]
    B10 --> B11[PAYMENT with credit_id]
    B11 --> B12[CREDIT status updated]

    %% Owner Operations
    O1[Owner reviews all operations] --> O2[Commission calculated]
    O2 --> O3[Reports generated]
    O3 --> O4[Expenses tracked]
    
    %% Audit Trail
    F2 -.-> A1[AUDIT_LOG entry]
    B3 -.-> A1
    B6 -.-> A1
    F6 -.-> A1
    
    %% Stock Adjustments
    F3 --> S1{Stock Issues?}
    S1 -->|Yes| S2[STOCK_ADJUSTMENT]
    S2 -.-> A1
```

---

## Core Entity Relationships Explained

### 1. **User Management Hierarchy**
- **SUPERADMIN** creates and manages **SHOP** entities
- **USER** entities have roles (owner, farmer, buyer, employee, guest)
- Each **USER** is associated with a **SHOP** (except guests)

### 2. **Stock Management Flow**
- **FARMER_STOCK** tracks farmer deliveries per product
- **TRANSACTION_ITEM** references specific **FARMER_STOCK** entries
- **STOCK_ADJUSTMENT** handles corrections and modifications

### 3. **Transaction & Payment Architecture**
- **TRANSACTION** can have multiple **TRANSACTION_ITEM** entries
- **PAYMENT** can be linked to **TRANSACTION** (direct) or **CREDIT** (repayment)
- **FARMER_PAYMENT** handles farmer settlements and advances

### 4. **Credit Management System**
- **CREDIT** tracks buyer's total outstanding amount
- **CREDIT_DETAIL** breaks down credit per farmer and product
- Multiple **PAYMENT** entries can settle one **CREDIT**

### 5. **Audit & Compliance**
- **AUDIT_LOG** captures all critical data changes
- JSON fields store old and new data states
- Complete traceability for regulatory compliance

---

## Key Business Rules Reflected in ERD

### 1. **Multi-Tenant Design**
- All core entities linked to **SHOP** for data isolation
- **SUPERADMIN** has cross-shop access capabilities

### 2. **Flexible Payment Models**
- Support for full payments, partial payments, and credit
- Advance payments to farmers before stock delivery
- Commission tracking per transaction

### 3. **Stock Lifecycle Management**
- Stock status progression: active → closed/returned/discarded
- Adjustment capabilities for corrections
- Historical tracking of all stock movements

### 4. **Credit Management**
- Per-buyer credit limits with real-time validation
- Detailed breakdown of credit per farmer
- Flexible repayment with partial payment support

---

## 📋 **ERD Implementation Notes**

### Database Constraints
- **Foreign Key Constraints**: Ensure data integrity across relationships
- **Check Constraints**: Validate enum values and business rules
- **Unique Constraints**: Prevent duplicate usernames and shop names
- **Not Null Constraints**: Enforce required fields

### Performance Considerations
- **Indexes**: Strategic indexing on frequently queried columns
- **Partitioning**: Consider partitioning AUDIT_LOG by date
- **Materialized Views**: For complex aggregations and reporting

### Scalability Features
- **JSON Fields**: Future-proof for additional attributes
- **Soft Deletes**: Status-based record management
- **Audit Trail**: Complete change tracking for compliance

This ERD serves as the foundational blueprint for the Market Management System, ensuring all business relationships are properly modeled and data integrity is maintained across all operations.
```


