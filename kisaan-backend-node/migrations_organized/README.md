# Migration Index

## Current Active Migrations
- 000_comprehensive_kisaan_schema.js (Base schema)
- 002_add_settlements_table.js (Settlements feature)

## Backup Migrations (Legacy)
All old migrations are in migrations_backup/ directory.

## Organization Structure
- 000-099: Core schema and base tables
- 100-199: User management features  
- 200-299: Transaction features
- 300-399: Settlement features
- 400-499: Reporting features
- 500-599: Product management
- 900-999: Maintenance and fixes

## Usage
Only run migrations from the main migrations/ directory.
Organized migrations are for reference and future planning.
