# KisaanCenter Python Scripts Overview

This document lists and describes all utility and test scripts in the `scripts/` folder for easy discovery and maintenance.

## Utility & Setup Scripts
- **setup_and_run.py**: Automates creation of superadmin, owner, and shop via API calls for initial system setup.
- **setup_super_admin.py**: Sets up the superadmin user in the system.
- **setup_aws_rds.py**: Configures AWS RDS for database hosting.
- **setup_test_database.py**: Initializes the test database for development and testing.
- **create_owner.py**: Script to create a shop owner user via API call.
- **create_shop.py**: Script to create a shop entity via API call.
- **fix_superadmin_status.py**: Fixes superadmin status in the database.
- **fix_superadmin_password.py**: Resets superadmin password via API call.
- **update_database_to_erd.py**: Updates the database schema to match the ERD.
- **validate_environment.py**: Validates environment setup and dependencies.

## Test Scripts
- **test_user_creation.py**: Script for testing user creation endpoints and scenarios.
- **test_role_fix.py**: Script for testing and fixing user role assignments in the database.
- **test_login_simple.py**: Script for testing simple login scenarios for users.
- **final_auth_test.py**: Comprehensive authentication test script.

## How to Use
- All scripts include a docstring at the top describing their purpose, usage, and dependencies.
- To run a script: `python scripts/<script_name>.py`
- For test scripts, check the backend/tests/ folder for more comprehensive test suites.

## Adding New Scripts
- Add new scripts to the `scripts/` folder and update this overview file with a description.
- Ensure each script has a clear docstring at the top.

---
This index helps prevent duplication and improves discoverability for all utility and test scripts in the KisaanCenter project.
