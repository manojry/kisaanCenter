Thanks for catching that 🚨 — I went back through our chat carefully.

You’re absolutely right:
👉 We agreed: Push Notifications are in scope (inside the app), but WhatsApp/SMS/Email are not for now.
So the corrected scope is:


Push Notifications only (in-app, owner → farmer/buyer/employee).


Excluded for now: WhatsApp, SMS, Email.



Here’s the clean, enterprise-grade rewritten central test plan document with this correction and all earlier rules baked in.


📘 Central Test Plan & Documentation (Enterprise-Grade)
Market Management System
This document is the single source of truth for app development, testing, and future extensions.

It covers entities, workflows, edge cases, enums, reference tables, and notifications.


1. Core Entities & Roles
Users

Owner: Manages shop, sets commission, pays farmers, tracks expenses.


Farmer: Supplies stock, requests advance/settlement.


Buyer: Purchases stock, may buy on credit, pays shop.


Employee: Records transactions, assists owner.


Guest Buyer: Walk-in buyer, default record per shop.



2. Business Rules
Stock Management

Farmer delivers products → recorded in FARMER_STOCK.


Unsold stock must remain visible until closed/discarded/returned.


Stock can be adjusted with reason (damage, return, correction).


Buyer Transactions

Buyers can pay full, partial, or credit.


Credit must record farmer, product, qty, price, date.


Credit repayment updates buyer ledger, reduces outstanding.


Farmer Settlements

Farmers may request advance at any time.


Settlement logic must:


Handle partial buyer payments.


Allow proportional settlement to farmer.


Deduct commission before settlement.



Commission

Commission defined by owner per product.


Types: percentage or fixed rate.


Stored in transaction for history (not recalculated).


No slabs/formulas yet (future extension).


Expenses

Shop can record expenses: wages, rent, utilities, other.


Expenses reduce owner profit.


Notifications

In scope: Push notifications only.


Triggered on:


Stock delivered


Payment made/received


Credit assigned/repayed


Settlement processed



Delivered via app (farmer, buyer, employee).



Not in scope now: WhatsApp, SMS, Email.



3. Reference Tables & ENUMs
Reference Tables

CATEGORY: Product types (fruit, veg, flower, grain).


PAYMENT_METHOD: Cash, UPI, card, cheque.


EXPENSE_CATEGORY: Wage, rent, utility, other.


PLAN: Subscription levels (basic, premium).


ENUM Fields

USER.role: owner, farmer, buyer, employee, guest.


USER.status: active, inactive, suspended.


TRANSACTION.type: sale, return, exchange.


TRANSACTION.status: pending, completed, cancelled.


FARMER_STOCK.status: active, closed, discarded, returned.


PAYMENT.type: full, partial, credit.


PAYMENT.status: pending, completed, failed, refunded.


FARMER_PAYMENT.payment_type: advance, settlement.


COMMISSION_RULE.rule_type: flat, percentage.



4. Workflows
Farmer Flow

Deliver stock → recorded in system.


Farmer dashboard shows sold, unsold stock.


Farmer requests advance/settlement.


Settlement deducts commission, adjusts balance.


Buyer Flow

Buyer selects products.


Transaction recorded.


Buyer pays (full/partial/credit).


Credit ledger updated.


Buyer ledger shows outstanding + repayments.


Owner Flow

Reviews stock deliveries, sales, payments.


Approves settlements, pays farmers.


Tracks expenses.


Reviews buyer/farmer ledgers.


Reviews reports (profit, credit exposure).



5. Audit & Logging

Audit Log Covers:


Transactions (sale/return edits).


Stock edits.


Farmer settlements.


Buyer credit changes.


Expense edits.



Each log stores: user, entity type, old_data, new_data, timestamp.



6. Test Coverage (Enterprise-Grade)
Push Notifications

test_push_notification_stock_delivery()


test_push_notification_buyer_payment()


test_push_notification_credit_created()


test_push_notification_credit_repaid()


test_push_notification_farmer_settlement()


Buyer Credit

test_buyer_credit_per_transaction_recorded()


test_buyer_credit_limit_enforced()


test_buyer_credit_repayment_updates_ledger()


test_buyer_credit_history_report()


Farmer Settlements

test_farmer_settlement_with_partial_payment()


test_farmer_settlement_with_advance()


test_farmer_unsold_stock_visible()


test_farmer_commission_deduction_correct()


Commission

test_commission_applied_per_product()


test_commission_fixed_vs_percentage()


test_commission_stored_in_transaction_history()


Expenses

test_expense_record_created()


test_expense_category_summary()


test_expense_report_affects_profit()


Audit Trail

test_audit_log_transaction_edit()


test_audit_log_stock_adjustment()


test_audit_log_farmer_payment()


test_audit_log_credit_update()



7. Edge Cases & Examples

Guest Buyer: Walk-in purchase → uses GUEST_BUYER record, no merging if later registered.


Multiple Prices: Same farmer product can be sold at different prices on same day.


Partial Buyer Payment: Buyer pays 50% today, 50% later → farmer settlement proportional.


Advance without Buyer Payment: Farmer can get advance even if buyer hasn’t paid yet.


Unsold Stock: Must remain visible on farmer dashboard until explicitly closed.


Return Transaction: Linked via parent_transaction_id.



✅ This rewritten document is now aligned with our actual agreed rules:


Only push notifications in scope.


WhatsApp/SMS/Email excluded.


Covers credit, settlement, stock, commission, expenses, audit.


Provides enums, reference tables, workflows, edge cases, and test cases.



Do you want me to now add example JSON payloads for push notifications and transactions (so dev team knows exact structure), or keep this as high-level documentation only?