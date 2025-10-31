# Cleanup & Implementation Strategy (Oct 31, 2025)

## Status Summary
✅ **Step 1 Complete**: Archived 33 ad-hoc root docs to `docs/archive/`
🟡 **Step 2-3 In Progress**: Migration audit and consolidation

## Overview
This document consolidates the comprehensive strategy for filling remaining gaps and cleaning up the codebase. It acts as the single source of truth, replacing all ad-hoc analysis docs.

---

## Part 1: Documentation Cleanup (COMPLETE)

### Action Taken
- Moved all 33 ad-hoc analysis/snapshot docs from root to `docs/archive/`
- Files like `PAYMENT_BALANCE_FIX.md`, `FRONTEND_BACKEND_ALIGNMENT.md`, etc. are now archived
- Root now contains only canonical docs: business docs, deployment guides, and DEVELOPMENT_RULEBOOK

### Remaining Root Docs (Canonical Only)
- `CORE_IDEA.md` - Core product vision
- `DEVELOPMENT_RULEBOOK.md` - Standards & conventions (with "reuse before create" rule)
- `Dockerfile*`, `docker-compose.yml` - Infrastructure
- `clear_shop_1_data.sql`, `insert_expenses_shop1.sql` - DB utilities

---

## Part 2: Migration Audit & Consolidation

### Findings
- **44 total migration files** (39 SQL, 5 TS) in `kisaan-backend-node/src/migrations/`
- **Key tables created**:
  - `payment_allocations` - Linking payments to transactions
  - `kisaan_transaction_ledger` - Transaction audit trail
  - `kisaan_expense_allocations` - Linking expenses to payments
  - `kisaan_transaction_settlements` - Settlement tracking
  - `kisaan_expenses` - Expense tracking

### Migration Sequencing (Chronological)
1. **20241222-add-performance-indexes.js** - Initial indexes
2. **20250924_* (6 files)** - Shop columns, transaction cleanup, idempotency
3. **20250925_* (8 files)** - FK constraints, ledger, payment allocations, timestamps
4. **20251018_* (7 files)** - Monetary precision, product denormalization, commission dedup
5. **20251019_* (10 files)** - Settlement tables, expense tracking, views
6. **20251021_* (2 files)** - Payment applied columns
7. **20251027_* (2 files)** - Schema constraints, computed views

### Critical Issues Identified

#### Issue 1: Constraint Ordering
- File `20251027_01_add_schema_constraints.sql` adds constraints that depend on data fixes
- Must run **after** all schema migrations and **before** data is loaded

#### Issue 2: View Dependencies
- File `20251027_02_create_computed_views.sql` joins multiple tables
- These views help with reporting but are optional for core transaction flow

#### Issue 3: Migration Runner
- Custom runner: `kisaan-backend-node/src/database/migration-runner.ts`
- Executes migrations via `npm run migrate`
- All migrations must be idempotent (can run multiple times safely)

---

## Part 3: Database Foundation Completion

### Schema State
✅ All core tables exist (users, shops, transactions, payments, expenses, products)
✅ Idempotency checks in place (CREATE TABLE IF NOT EXISTS, DROP IF EXISTS)
✅ FK constraints defined
⚠️ Some view references may be stale during initial migration

### Data Fixes Required
1. **Role-based shop_id validation** - Apply from `20251027_01_add_schema_constraints.sql`
2. **Transaction amount invariants** - Already enforced in constraints
3. **Payment-transaction linking** - Via `payment_allocations` table
4. **Expense tracking** - Via `kisaan_expenses` and `kisaan_expense_allocations`

### Validation Queries
After running migrations, validate:
```sql
-- Check constraint compliance
SELECT COUNT(*) as violations FROM kisaan_users 
WHERE (role = 'owner' AND shop_id IS NOT NULL)
   OR (role IN ('farmer', 'buyer') AND shop_id IS NULL);

-- Check transaction amount invariants
SELECT COUNT(*) as violations FROM kisaan_transactions 
WHERE ABS(total_amount - (commission_amount + farmer_earning)) > 0.01;

-- Verify critical tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'kisaan_users', 'kisaan_shops', 'kisaan_transactions', 
  'kisaan_payments', 'kisaan_expenses', 'payment_allocations'
);
```

---

## Part 4: Implementation Gaps to Fill

### Gap 1: Balance Calculation Service
**File**: `kisaan-backend-node/src/services/BalanceCalculationService.ts` (MISSING)
**Purpose**: Calculate user balance from transactions, payments, and expenses

**Required Methods**:
```typescript
- calculateBalance(userId: number): Promise<Decimal>
- calculateBalanceByShop(shopId: number): Promise<{[userId:number]: Decimal}>
- getBalanceSnapshot(userId: number, asOfDate: Date): Promise<Decimal>
- validateBalanceConsistency(userId: number): Promise<{isValid: boolean, issues: string[]}>
```

**Implementation Details**:
1. Sum all transaction farmer_earnings for the user
2. Subtract all payments received
3. Subtract all expenses assigned to user
4. Compare with kisaan_users.balance field
5. Log any discrepancies to audit trail

### Gap 2: Transaction Settlement Tracking
**File**: `kisaan-backend-node/src/services/TransactionSettlementService.ts` (MISSING)
**Purpose**: Link transactions, payments, and expenses through settlement process

**Required Methods**:
```typescript
- settleTransaction(transactionId: number, amount: Decimal): Promise<Settlement>
- settleExpense(expenseId: number, paymentId: number): Promise<Settlement>
- getSettlementHistory(transactionId: number): Promise<Settlement[]>
- reconcileSettlements(): Promise<{matched: number, unmatched: number}>
```

### Gap 3: Payment Allocation Logic
**File**: `kisaan-backend-node/src/services/PaymentAllocationService.ts` (MISSING)
**Purpose**: Allocate incoming payments to outstanding transactions/expenses

**Required Methods**:
```typescript
- allocatePayment(paymentId: number, shopId: number): Promise<Allocation[]>
- getOutstandingBalance(shopId: number): Promise<Decimal>
- autoAllocatePayments(shopId: number): Promise<{allocated: number, remaining: Decimal}>
```

### Gap 4: Immutable Transaction Model
**File**: `kisaan-backend-node/src/models/Transaction.ts` (NEEDS REFACTOR)
**Current Issues**: Transaction can be modified after creation
**Required Changes**:
1. Add `is_locked` boolean field
2. Prevent updates to amount fields once locked
3. Add audit log for any modifications
4. Enforce locking after payment allocation

### Gap 5: Commission Override System
**Status**: Partially implemented
**File**: `docs/COMMISSION_OVERRIDES.md` exists but needs backend implementation

**Required**:
1. `kisaan_user_custom_commission_rate` table (check if exists)
2. Service to fetch custom rate or use plan default
3. Apply custom rate in commission calculation
4. Validation to prevent retroactive application

---

## Part 5: Execution Plan (Next Steps)

### Phase 1: Migration Validation (TODAY)
```bash
cd kisaan-backend-node
npm run migrate  # Execute all migrations
npm run schema:structure  # Verify schema
```

### Phase 2: Balance Service Implementation (TOMORROW)
1. Create `BalanceCalculationService.ts` with full reconciliation logic
2. Add test cases for known data scenarios
3. Integrate with UserController balance endpoint

### Phase 3: Settlement Integration (FOLLOWING DAY)
1. Create `TransactionSettlementService.ts` and `PaymentAllocationService.ts`
2. Update `PaymentController` to use new allocation logic
3. Add settlement linking to `TransactionModel`

### Phase 4: Data Integrity (FINAL)
1. Run constraint validation queries
2. Fix any constraint violations
3. Generate final state report

---

## Part 6: Canonical Files Updated Today

- ✅ `DEVELOPMENT_RULEBOOK.md` - Rule #1: "Always reuse before creating new files"
- ✅ `DOCS_STATUS.md` - Confirms deprecated status of all archived docs
- ✅ This file: `CLEANUP_AND_IMPLEMENTATION_STRATEGY.md` - Consolidates all analysis

---

## Part 7: Key Commands Reference

```bash
# Run migrations
npm run migrate

# Verify schema structure
npm run schema:structure

# Seed features (idempotent)
npm run features:seed

# Run tests
npm run test

# Dev server with hot reload
npm run dev
```

---

## Rulebook Compliance

✅ **"Reuse before create"**: All work goes into canonical files
✅ **"Keep only canonical docs"**: Archived 33 ad-hoc docs
✅ **"No duplicate scripts"**: Deleted redundant db-cleanup* scripts
✅ **"Idempotent migrations"**: All migrations check for existence first

---

**Generated**: October 31, 2025
**Next Review**: After Phase 1 migration validation
