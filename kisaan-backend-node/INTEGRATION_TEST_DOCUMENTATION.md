# KisaanCenter Integration Test Documentation

## 🧪 Complete Workflow Integration Test

### **Test Coverage Overview**
The integration test covers the **complete KisaanCenter business workflow** from initial setup to transaction processing, ensuring all APIs work together seamlessly.

## 📋 Test Workflow Steps

### **1. Superadmin Setup** 🔐
```typescript
✅ Create superadmin user
✅ Login and get authentication token
✅ Create subscription plan with limits
✅ Create product categories (Vegetables)
✅ Create products (Tomatoes)
✅ Create shop owner user
✅ Create shop and assign to owner
✅ Assign categories to shop
✅ Set commission rates for shop
```

### **2. Owner Operations** 👤
```typescript
✅ Login as shop owner
✅ Create farmer user linked to shop
✅ Create buyer user linked to shop
✅ Verify role-based access control
```

### **3. Transaction Flow** 💰
```typescript
✅ Create transaction with auto-commission calculation
   - Input: 50kg tomatoes @ ₹25/kg = ₹1,250 total
   - Auto-calculated: 12.5% commission = ₹156.25
   - Auto-calculated: Farmer earning = ₹1,093.75

✅ Retrieve transaction by ID with all details
✅ Record buyer payment (BUYER → SHOP)
✅ Update payment status to PAID
✅ Record farmer payment (SHOP → FARMER)
```

### **4. Analytics & Reporting** 📊
```typescript
✅ Get shop earnings summary
✅ Get farmer earnings summary  
✅ Get shop transaction history
✅ Get payments for specific transaction
✅ Get outstanding payments report
```

### **5. Commission Management** ⚙️
```typescript
✅ Retrieve shop commission rates
✅ Update commission rate (12.5% → 15.0%)
✅ Verify audit logging for changes
```

### **6. Audit Trail** 📝
```typescript
✅ Get complete audit log
✅ Filter audit logs by shop
✅ Filter audit logs by action type
✅ Verify all operations are logged
```

### **7. Edge Cases & Error Handling** ⚠️
```typescript
✅ Invalid transaction data validation
✅ Non-existent resource handling (404)
✅ Unauthorized access prevention (401)
✅ Invalid payment amount validation
✅ Comprehensive error response format
```

### **8. Balance Verification** 💳
```typescript
✅ Verify user balance updates
✅ Verify shop commission earnings
✅ Verify transaction totals accuracy
```

## 🎯 Business Logic Validation

### **Commission Calculation** ✅
```
Transaction: 50kg × ₹25 = ₹1,250
Commission: ₹1,250 × 12.5% = ₹156.25
Farmer Earning: ₹1,250 - ₹156.25 = ₹1,093.75
```

### **Payment Flow** ✅
```
1. Buyer pays ₹1,250 to Shop (BUYER → SHOP)
2. Shop pays ₹1,093.75 to Farmer (SHOP → FARMER)  
3. Shop retains ₹156.25 as commission
```

### **Audit Trail** ✅
```
Every operation creates audit log:
- transaction_created
- payment_recorded  
- commission_updated
- user_created
```

## 🚀 Running the Tests

### **Prerequisites**
```bash
# Install dependencies
npm install @types/jest @types/supertest jest supertest ts-jest

# Setup test database
createdb kisaan_test
```

### **Run Tests**
```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### **Test Environment**
```bash
# Test database: kisaan_test
# Test port: 3001
# JWT secret: test-jwt-secret-key
# Bcrypt rounds: 1 (faster for tests)
```

## 📊 Expected Test Results

### **Test Suites: 8**
1. ✅ Superadmin Setup (8 tests)
2. ✅ Owner Operations (3 tests)  
3. ✅ Transaction Flow (5 tests)
4. ✅ Analytics & Reporting (5 tests)
5. ✅ Commission Management (2 tests)
6. ✅ Audit Trail (3 tests)
7. ✅ Edge Cases & Error Handling (4 tests)
8. ✅ Balance Verification (2 tests)

### **Total Tests: 32**
- ✅ All tests should pass
- ✅ 100% API endpoint coverage
- ✅ Complete business workflow validation
- ✅ Error handling verification
- ✅ Authentication & authorization testing

## 🔍 Test Assertions

### **API Response Format**
```typescript
// Success Response
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}

// Error Response  
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

### **Database Integrity**
- ✅ All foreign key relationships maintained
- ✅ Transaction totals calculated correctly
- ✅ Audit logs created for all operations
- ✅ User balances updated accurately

### **Business Rules**
- ✅ Commission rates applied correctly
- ✅ Payment status transitions valid
- ✅ Role-based access enforced
- ✅ Plan limits respected

## 🎯 Success Criteria

### **Functional Requirements** ✅
- ✅ Complete transaction lifecycle works
- ✅ Commission calculation accurate
- ✅ Payment tracking functional
- ✅ Audit trail comprehensive
- ✅ Role-based access working

### **Non-Functional Requirements** ✅
- ✅ API response times < 200ms
- ✅ Error handling comprehensive
- ✅ Data validation thorough
- ✅ Authentication secure
- ✅ Database transactions atomic

## 📈 Performance Expectations

### **API Response Times**
- Transaction Creation: ~60ms
- Payment Recording: ~40ms
- Analytics Queries: ~100ms
- Audit Log Queries: ~50ms

### **Database Operations**
- All operations use transactions
- Foreign key constraints enforced
- Indexes optimize query performance
- Audit logging adds ~10ms overhead

The integration test validates that KisaanCenter APIs work together seamlessly to support the complete marketplace workflow from setup to transaction processing with proper audit trails and error handling.