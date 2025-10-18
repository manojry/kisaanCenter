# Validation Scripts

This directory contains manual validation and testing scripts for the KisaanCenter API. These are not automated unit tests but rather debugging and integration validation tools.

## Scripts Overview

### API Testing Scripts
- `integration-test.js` - Comprehensive integration test that creates test transactions and validates balance calculations
- `step-by-step-test.js` - Detailed step-by-step transaction flow testing with database verification
- `test-login-format.js` - Validates login API response format
- `test-payment-auth.js` - Tests payment endpoint authentication
- `test-simplified-system.js` - Tests simplified API endpoints

### Validation Scripts
- `validate-integration.js` - Validates API endpoint availability and response formats
- `validate-integration-updated.js` - Updated version of integration validation

## Usage

These scripts are designed to be run manually for debugging and validation purposes. They often require:

- A running backend server
- Database access
- Proper environment variables configured

## Note

These scripts were moved from the root directory during test cleanup. They provide value for manual testing and validation but are not part of an automated test suite.