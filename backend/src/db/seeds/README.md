
# Database Seeding Scripts

This directory contains comprehensive database seeding scripts for the KisaanCenter application.

## Overview

The seeding system provides a complete set of sample data for development, testing, and demonstration purposes. All scripts are designed to be idempotent and can be run multiple times safely.

## Scripts Overview

### Individual Seed Scripts

1. **`seed_001_basic_reference_data.py`**
   - Seeds categories, units, and subscription plans
   - Foundation data required by other scripts

2. **`seed_002_sample_users_and_shops.py`**
   - Creates sample users for all roles (Admin, Shop Owner, Farmer, Buyer)
   - Sets up sample shops with proper relationships

3. **`seed_003_products_and_stock.py`**
   - Creates sample products across different categories
   - Generates farmer stock records with realistic data

4. **`seed_004_sample_transactions.py`**
   - Creates sample transactions with various statuses
   - Includes transaction items and payment scenarios

5. **`seed_005_commission_rules.py`**
   - Sets up commission rules for shops and products
   - Configures different commission structures

6. **`seed_006_payment_records.py`**
   - Creates farmer payment records
   - Sets up buyer credit accounts

7. **`seed_007_audit_logs.py`**
   - Generates sample audit trail records
   - Tracks various system activities

8. **`seed_008_notifications.py`**
   - Creates sample notifications for all user types
   - Includes read/unread status examples

### Utility Scripts

- **`run_complete_seeding.py`** - Runs all seed scripts in correct order
- **`cleanup_seed_data.py`** - Removes all seeded data for fresh start
- **`verify_seed_data.py`** - Verifies data integrity and completeness

### Automation Scripts

- **`../scripts/seed_database.sh`** - Bash automation script
- **`../scripts/quick_seed.sh`** - Fast seeding for development

## Usage

### Complete Seeding
```bash
# Run all seed scripts
python -m src.db.seeds.run_complete_seeding

# Or use the automation script
./scripts/seed_database.sh
