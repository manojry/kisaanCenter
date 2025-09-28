# KisaanCenter Database Schema Management

This directory contains the complete database schema management system for KisaanCenter, designed to be reusable, extensible, and maintainable.

## 📁 Directory Structure

```
schema/
├── complete-schema.sql     # Complete unified schema
├── indexes.sql            # All database indexes
├── schema-manager.js      # CLI management utility
├── modules/               # Modular schema components
│   ├── core-entities.sql  # Users, Shops, Plans, Categories
│   ├── transactions.sql   # Transactions and Payments
│   └── financial.sql      # Credits, Settlements, Commissions
├── extensions/            # Optional schema extensions
└── README.md             # This file
```

## 🚀 Quick Start

### Initialize Schema
```bash
cd schema
node schema-manager.js init
```

### Validate Current Schema
```bash
node schema-manager.js validate
```

### Reset Schema (⚠️ DANGER: Drops all data)
```bash
node schema-manager.js reset
```

## 📋 Schema Components

### Core Tables
- **kisaan_users** - User management (farmers, buyers, owners, superadmins)
- **kisaan_shops** - Shop/business entities
- **kisaan_plans** - Subscription plans
- **kisaan_categories** - Product categories
- **kisaan_products** - Product catalog

### Business Logic Tables
- **kisaan_transactions** - Core transaction records
- **kisaan_payments** - Payment tracking
- **payment_allocations** - Payment to transaction mapping
- **kisaan_commissions** - Commission structure

### Financial Management
- **kisaan_credits** - Credit/advance management
- **kisaan_settlements** - Settlement tracking
- **balance_snapshots** - Balance history and auditing

### Relationship Tables
- **kisaan_shop_categories** - Shop-Category mappings
- **kisaan_shop_products** - Shop-Product mappings

### Administration
- **kisaan_plan_usage** - Plan usage tracking
- **kisaan_audit_logs** - System audit trail
- **SequelizeMeta** - Migration tracking (Sequelize compatibility)

## 🔧 Schema Features

### Enum Types
All status fields and categorical data use PostgreSQL enums for data integrity:
- User roles: `superadmin`, `owner`, `farmer`, `buyer`
- Payment status: `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`
- Payment methods: `cash`, `upi`, `bank_transfer`, `card`, `cheque`
- And more...

### Indexing Strategy
- **Primary indexes** on all ID fields
- **Unique indexes** for business constraints
- **Performance indexes** for common queries
- **Partial indexes** for filtered queries
- **Composite indexes** for multi-column queries

### Data Integrity
- Foreign key constraints with appropriate cascade rules
- Check constraints for business rules
- NOT NULL constraints for required fields
- Default values for optional fields

## 🔄 Extending the Schema

### Adding New Tables
1. Create a new module file in `modules/`
2. Follow the existing naming conventions
3. Add appropriate indexes to `indexes.sql`
4. Update the schema manager if needed

### Adding New Extensions
1. Create `.sql` files in `extensions/`
2. Files are executed in alphabetical order
3. Use `IF NOT EXISTS` clauses for safety

### Example Extension
```sql
-- extensions/analytics.sql
CREATE TABLE IF NOT EXISTS kisaan_analytics (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT REFERENCES kisaan_shops(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(15,2),
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠 Migration from Old System

### Cleanup Old Migrations
The new system replaces the old migration-based approach. Old migration files in `/migrations/` can be safely removed after schema initialization.

### Model Alignment
Backend Sequelize models should be updated to match the schema:

1. Check enum definitions
2. Verify field types and constraints
3. Update association definitions
4. Test model synchronization

## 📊 Performance Considerations

### Optimized for Common Queries
- Shop-based data filtering
- User role-based access
- Date range queries
- Status-based filtering
- Transaction reporting

### Index Coverage
- All foreign keys indexed
- Common filter columns indexed
- Composite indexes for multi-column sorts
- Partial indexes for status-based queries

## 🔐 Security Features

### Data Protection
- Sensitive fields properly typed
- Foreign key constraints prevent orphaned data
- Enum types prevent invalid status values
- Audit logging for change tracking

### Access Patterns
- Role-based data access through user.role
- Shop-based data isolation through shop_id
- Hierarchical user management through created_by

## 🧪 Testing

### Schema Validation
```bash
# Test schema initialization
node schema-manager.js init

# Validate all tables exist
node schema-manager.js validate

# Test with backend models
cd ..
npm run test:models
```

### Performance Testing
```bash
# Generate test data
node test-data-generator.js

# Run performance benchmarks
node performance-tests.js
```

## 📈 Monitoring

### Key Metrics to Monitor
- Table sizes and growth rates
- Index usage statistics
- Query performance
- Foreign key constraint violations
- Enum value distribution

### Maintenance Tasks
- Regular `ANALYZE` on large tables
- Index maintenance for heavy-write tables
- Partition consideration for time-series data (balance_snapshots, audit_logs)

## 🔄 Version Control

### Schema Versioning
- Complete schema is version controlled
- Changes tracked through git
- Breaking changes documented in CHANGELOG

### Deployment Strategy
1. Test schema changes in development
2. Validate with existing data
3. Deploy to staging environment
4. Production deployment with downtime window if needed

## 🆘 Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Ensure database user has proper permissions
GRANT ALL PRIVILEGES ON DATABASE kisaan_dev TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

#### Connection Issues
```bash
# Check environment variables
echo $DB_HOST $DB_NAME $DB_USER

# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

#### Index Conflicts
```bash
# Drop conflicting indexes before running schema
DROP INDEX IF EXISTS conflicting_index_name;
```

### Recovery Procedures

#### Schema Corruption
1. Backup current data
2. Run `node schema-manager.js reset`
3. Restore data from backup

#### Partial Failures
1. Check error logs
2. Fix specific issues
3. Re-run `node schema-manager.js init`

## 📞 Support

For schema-related issues:
1. Check this README
2. Validate environment configuration
3. Test with a clean database
4. Review error logs for specific issues

---

**Note**: Always backup your database before running schema operations in production!