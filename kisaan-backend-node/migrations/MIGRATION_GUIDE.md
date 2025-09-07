# Migration Organization Guide

## Current Migration Structure

### Base Schema (000_comprehensive_kisaan_schema.js)
- Creates all core tables and relationships
- Establishes enums and indexes
- Should only be run once on fresh database

### Feature Migrations (001+)
- Each new feature gets its own migration
- Includes safety checks for existing tables/columns
- Follows semantic versioning pattern

## Migration Naming Convention

```
[NUMBER]_[ACTION]_[FEATURE]_[DESCRIPTION].js

Examples:
- 000_comprehensive_kisaan_schema.js (base schema)
- 001_create_settlements_table.js (new feature)
- 002_add_user_phone_column.js (column addition)
- 003_update_transaction_status_enum.js (enum update)
```

## Migration Best Practices

### 1. Safety Checks
Always check if tables/columns exist before creating:
```javascript
const tableExists = await queryInterface.sequelize.query(
  "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'table_name');"
);
```

### 2. Rollback Support
Every migration must have a proper `down` function:
```javascript
async down(queryInterface, Sequelize) {
  await queryInterface.dropTable('table_name');
}
```

### 3. Index Management
Add indexes for performance:
```javascript
await queryInterface.addIndex('table_name', ['column_name']);
await queryInterface.addIndex('table_name', ['col1', 'col2'], { unique: true });
```

### 4. Foreign Key Constraints
Always include proper references:
```javascript
shop_id: {
  type: DataTypes.INTEGER,
  references: {
    model: 'kisaan_shops',
    key: 'id'
  },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
}
```

## Running Migrations

### Fresh Database
```bash
npx sequelize-cli db:migrate --migrations-path migrations --config config/config.js
```

### Specific Migration
```bash
npx sequelize-cli db:migrate:up --to 002_add_settlements_table.js --migrations-path migrations --config config/config.js
```

### Rollback Migration
```bash
npx sequelize-cli db:migrate:undo --migrations-path migrations --config config/config.js
```

### Check Migration Status
```bash
npx sequelize-cli db:migrate:status --migrations-path migrations --config config/config.js
```

## Troubleshooting

### "Relation already exists" Error
1. Check if migration was partially run
2. Use safety checks in migration
3. Manually rollback if needed:
```sql
DELETE FROM "SequelizeMeta" WHERE name = 'migration_name.js';
```

### Index Conflicts
Drop existing indexes before recreating:
```javascript
try {
  await queryInterface.removeIndex('table_name', 'index_name');
} catch (error) {
  // Index doesn't exist, continue
}
await queryInterface.addIndex('table_name', ['column']);
```

## Future Migration Organization

### By Feature Area
```
migrations/
├── 000_base_schema.js
├── 001-099_user_management/
├── 100-199_transactions/
├── 200-299_settlements/
├── 300-399_reports/
└── 900-999_maintenance/
```

### Migration Templates
Create templates for common operations:
- add_table_template.js
- add_column_template.js
- update_enum_template.js

## Database Backup Strategy

### Before Major Migrations
```bash
pg_dump kisaan_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Test Migrations
Always test on development database first:
1. Backup production data
2. Restore to development
3. Run migration
4. Verify functionality
5. Apply to production