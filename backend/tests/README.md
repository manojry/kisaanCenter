# KisaanCenter Backend Test Suite

This folder contains automated tests for all major business rules, CRUD operations, and relationships in the KisaanCenter backend.

## How to Run Tests

1. Ensure your test database is configured and seeded with test data.
2. Install test dependencies:
   ```bash
   pip install pytest
   ```
3. Run all tests:
   ```bash
   pytest backend/tests/
   ```

## Test Coverage

- User roles: Superadmin, Shop Owner, Employees, Farmers, Buyers
- Shop ownership and employee relationships
- Product catalog and status
- Transactions: status, integrity, business rules
- Payments and credits
- Business rules: owner/employee/farmer flows

## Adding More Tests

- Add new test files for new features or business rules.
- Use fixtures in `conftest.py` for consistent setup/teardown.
- Extend test cases to cover edge cases and error handling.

## Best Practices

- Run tests before every deployment or migration.
- Keep test data up-to-date with seed logic.
- Use CI/CD to automate test runs.
