
# Enhanced Entity Relationship Diagram - Farmer Stock Management

## Core Tables

### farmer_stock
farmer_stock {
    id: INTEGER [PK]
    farmer_user_id: INTEGER [FK -> users.id] [INDEX]
    product_id: INTEGER [FK -> products.id] [INDEX]
    shop_id: INTEGER [FK -> shop.id] [INDEX]

    -- Stock Quantities
    declared_qty: DECIMAL(10,3) [NULL] -- NULL for implicit mode
    sold_qty: DECIMAL(10,3) [NOT NULL, DEFAULT 0]
    
    -- Pricing
    unit_price: DECIMAL(10,2) [NULL]
    total_value: DECIMAL(12,2) [COMPUTED]
    
    -- Stock Management
    mode: ENUM(declared, implicit) [NOT NULL, DEFAULT implicit]
    declared_at: DATETIME [NULL]
    declared_by_id: INTEGER [FK -> users.id] [NULL]
    
    -- Carryover Support
    carry_forward: BOOLEAN [DEFAULT false]
    carried_from_date: DATE [NULL]
    
    -- Business Fields
    entry_date: DATE [NOT NULL, DEFAULT today] [INDEX]
    notes: TEXT [NULL]
    
    -- System Fields
    created_at: DATETIME [NOT NULL]
    updated_at: DATETIME [NOT NULL]
    status: ENUM(active, inactive, archived) [NOT NULL, DEFAULT active]
    
    -- Constraints
    UNIQUE(farmer_user_id, product_id, entry_date, shop_id)
    CHECK(declared_qty IS NULL OR declared_qty > 0)
    CHECK(sold_qty >= 0)
    CHECK(unit_price IS NULL OR unit_price > 0)
    CHECK((mode = 'declared' AND declared_qty IS NOT NULL AND declared_by_id IS NOT NULL) OR mode = 'implicit')
    CHECK((carry_forward = true AND carried_from_date IS NOT NULL) OR (carry_forward = false AND carried_from_date IS NULL))

    
### farmer_stock_audit
farmer_stock_audit {
    id: INTEGER [PK]
    farmer_stock_id: INTEGER [FK -> farmer_stock.id] [INDEX]
    performed_by_id: INTEGER [FK -> users.id] [INDEX]

    -- Audit Details
    action_type: VARCHAR(50) [NOT NULL] -- declare, sale, update, late_declare, carry_forward, correction, mode_change
    old_values: JSONB [NULL]
    new_values: JSONB [NULL]
    
    -- Context
    transaction_id: INTEGER [FK -> transactions.id] [NULL]
    notes: TEXT [NULL]
    
    -- System Fields
    timestamp: DATETIME [NOT NULL, DEFAULT now] [INDEX]

    
## Computed Properties

### farmer_stock Computed Fields
- `balance_qty`: declared_qty - sold_qty (NULL if not declared)
- `sold_value`: sold_qty * unit_price (NULL if no unit_price)
- `is_oversold`: sold_qty > declared_qty (false if not declared)
- `completion_percentage`: (sold_qty / declared_qty) * 100 (NULL if not declared)

## Relationships

### farmer_stock Relationships
- `farmer_user` → users (farmer_user_id)
- `declared_by` → users (declared_by_id)
- `product` → products (product_id)
- `shop` → shop (shop_id)
- `audit_logs` → farmer_stock_audit (one-to-many)

### farmer_stock_audit Relationships
- `farmer_stock` → farmer_stock (farmer_stock_id)
- `performed_by` → users (performed_by_id)
- `transaction` → transactions (transaction_id)

## Indexes

### Performance Indexes
- `idx_farmer_stock_lookup`: (farmer_user_id, product_id, entry_date)
- `idx_farmer_stock_shop_date`: (shop_id, entry_date)
- `idx_farmer_stock_mode`: (mode, entry_date)
- `idx_farmer_stock_audit_fsid`: (farmer_stock_id)
- `idx_farmer_stock_audit_action`: (action_type)
- `idx_farmer_stock_audit_created_at`: (timestamp)

## Business Rules

### Stock Declaration Rules
1. **Declared Mode**: Must have declared_qty and declared_by_id
2. **Implicit Mode**: declared_qty and declared_by_id are NULL
3. **Late Declaration**: Can convert implicit to declared mode
4. **Unique Daily Record**: One record per farmer+product+date+shop

### Stock Deduction Rules
1. **Overselling Allowed**: System warns but allows selling more than declared
2. **Negative Stock Prevention**: sold_qty cannot be negative
3. **Audit Trail**: All changes logged automatically

### Carry Forward Rules
1. **Declared Stock Only**: Can only carry forward declared stock with remaining balance
2. **No Duplicate Target**: Cannot carry forward to date that already has stock record
3. **Positive Balance**: Must have positive balance_qty to carry forward

## Data Flow Examples

### Declared Flow

1.
Farmer declares 100kg roses → mode=declared, declared_qty=100, sold_qty=0
2.
Sale of 40kg → sold_qty=40, balance_qty=60
3.
Sale of 30kg → sold_qty=70, balance_qty=30
4.
End of day → balance_qty=30 available for carry forward


### Implicit Flow

1.
Sale of 25kg (no declaration) → mode=implicit, declared_qty=NULL, sold_qty=25
2.
Sale of 30kg → sold_qty=55
3.
Late declaration of 200kg → mode=declared, declared_qty=200, balance_qty=145

### Mixed Flow Transition

1.
Start: mode=implicit, sold_qty=75
2.
Late declare 200kg → mode=declared,
declared_qty=200, balance_qty=125
3. Continue sales → sold_qty=150, balance_qty=50
4. Overselling scenario → sold_qty=220, balance_qty=-20 (oversold by 20kg)

### Carry Forward Example
Day 1: declared_qty=100, sold_qty=60, balance_qty=40
Day 2: carry_forward=true, carried_from_date=Day1, declared_qty=40, sold_qty=0


## API Endpoints Design

### Core Stock Operations
- `POST /api/v1/farmer-stock/` - Create stock record
- `GET /api/v1/farmer-stock/{id}` - Get stock details
- `PUT /api/v1/farmer-stock/{id}` - Update stock record
- `DELETE /api/v1/farmer-stock/{id}` - Soft delete stock record

### Declaration Operations
- `POST /api/v1/farmer-stock/{id}/declare` - Late stock declaration
- `PUT /api/v1/farmer-stock/{id}/mode` - Change stock mode

### Stock Management
- `POST /api/v1/farmer-stock/{id}/deduct` - Deduct stock for sale
- `POST /api/v1/farmer-stock/{id}/carry-forward` - Carry forward remaining stock
- `GET /api/v1/farmer-stock/{id}/audit` - Get audit trail

### Reporting & Analytics
- `GET /api/v1/farmer-stock/summary` - Daily stock summary
- `GET /api/v1/farmer-stock/shop/{shop_id}/overview` - Shop stock overview
- `GET /api/v1/farmer-stock/farmer/{farmer_id}/history` - Farmer stock history

## Query Patterns

### Daily Stock Report
```sql
SELECT 
    fs.farmer_user_id,
    u.username as farmer_name,
    fs.product_id,
    p.name as product_name,
    fs.mode,
    fs.declared_qty,
    fs.sold_qty,
    CASE 
        WHEN fs.declared_qty IS NOT NULL 
        THEN fs.declared_qty - fs.sold_qty 
        ELSE NULL 
    END as balance_qty,
    fs.is_oversold,
    fs.completion_percentage
FROM farmer_stock fs
JOIN users u ON fs.farmer_user_id = u.id
JOIN products p ON fs.product_id = p.id
WHERE fs.entry_date = CURRENT_DATE
    AND fs.shop_id = ?
    AND fs.status = 'active'
ORDER BY u.username, p.name;

Oversold Stock Alert
SELECT 
    fs.id,
    u.username as farmer_name,
    p.name as product_name,
    fs.declared_qty,
    fs.sold_qty,
    (fs.sold_qty - fs.declared_qty) as excess_qty
FROM farmer_stock fs
JOIN users u ON fs.farmer_user_id = u.id
JOIN products p ON fs.product_id = p.id
WHERE fs.declared_qty IS NOT NULL
    AND fs.sold_qty > fs.declared_qty
    AND fs.entry_date = CURRENT_DATE
    AND fs.shop_id = ?
    AND fs.status = 'active'
ORDER BY excess_qty DESC;

ORDER BY excess_qty DESC;
SELECT 
    fs.entry_date,
    COUNT(*) as total_records,
    COUNT(CASE WHEN fs.mode = 'declared' THEN 1 END) as declared_records,
    COUNT(CASE WHEN fs.mode = 'implicit' THEN 1 END) as implicit_records,
    ROUND(
        COUNT(CASE WHEN fs.mode = 'declared' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as declaration_rate_percent
FROM farmer_stock fs
WHERE fs.shop_id = ?
    AND fs.entry_date >= CURRENT_DATE - INTERVAL '30 days'
    AND fs.status = 'active'
GROUP BY fs.entry_date
ORDER BY fs.entry_date DESC;

Performance Considerations
Indexing Strategy
1.
Primary Lookup: (farmer_user_id, product_id, entry_date) - Most common query pattern
2.
Shop Reports: (shop_id, entry_date) - Daily shop summaries
3.
Mode Analysis: (mode, entry_date) - Declaration rate tracking
4.
Audit Queries: (farmer_stock_id, timestamp) - Audit trail lookup
Partitioning Strategy
-- Partition farmer_stock by entry_date (monthly partitions)
CREATE TABLE farmer_stock_y2024m01 PARTITION OF farmer_stock
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Partition farmer_stock_audit by timestamp (monthly partitions)
CREATE TABLE farmer_stock_audit_y2024m01 PARTITION OF farmer_stock_audit
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

Archival Strategy
-- Archive old stock records (older than 2 years)
UPDATE farmer_stock 
SET status = 'archived'
WHERE entry_date < CURRENT_DATE - INTERVAL '2 years'
    AND status = 'active';

-- Archive old audit records (older than 5 years)
DELETE FROM farmer_stock_audit
WHERE timestamp < CURRENT_DATE - INTERVAL '5 years';

Integration Points
Transaction System Integration
When transaction item is created → Update farmer_stock.sold_qty
When transaction is cancelled → Reverse farmer_stock.sold_qty
Transaction validation → Check farmer_stock availability
Payment System Integration
Farmer payment calculation → Based on farmer_stock.sold_value
Commission calculation → Based on farmer_stock.sold_value * commission_rate
Reporting System Integration
Daily reports → farmer_stock summary data
Monthly analytics → farmer_stock aggregations
Farmer statements → farmer_stock transaction history
Security & Access Control
Role-Based Access
Superadmin: Full access to all operations
Owner: Full access within shop scope
Employee: Read access + stock deduction for sales
Farmer: Read access to own stock records only
Buyer: No direct access to stock data
Data Privacy
Farmer stock quantities visible only to shop staff
Pricing information restricted to authorized roles
Audit trails accessible only to admin roles
Monitoring & Alerts
Business Alerts
1.
Overselling Alert: When sold_qty > declared_qty
2.
Low Declaration Rate: When daily declaration rate < 50%
3.
Unusual Stock Patterns: Large quantity variations
4.
Audit Anomalies: Frequent corrections or adjustments
Performance Monitoring
1.
Query Performance: Monitor slow queries on farmer_stock
2.
Storage Growth: Track table size growth patterns
3.
Index Usage: Monitor index effectiveness
4.
Partition Performance: Track partition pruning efficiency


This completes the enhanced ERD documentation for the farmer stock management system. The design provides:

1. **Flexible dual-flow support** (declared vs implicit)
2. **Comprehensive audit trail** for all changes
3. **Robust business rule enforcement** through constraints
4. **Performance optimization** through proper indexing
5. **Scalability considerations** with partitioning strategy
6. **Integration points** with existing transaction/payment systems

The database schema is now ready to support both traditional declared stock management and modern implicit stock tracking based on sales data.