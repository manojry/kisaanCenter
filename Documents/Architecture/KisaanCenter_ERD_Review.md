# KisaanCenter ERD Improvement Notes

## Strengths
- Normalized tables for transactions, items, stock, audit log
- Unified USER table with role enum
- PLAN table for owner tiers
- Edge cases (partial payments, credit, expenses) covered
- ENUM/reference table strategy
- Workflow matches ERD

## Over-Design / Complexity
- FARMER, BUYER, EMPLOYEE tables duplicate USER (role)
  - Suggest: Use USER only, add FARMER_PROFILE etc. if needed
- created_by_superadmin_id: Use created_by (user_id) universally
- FARMER_STOCK_COMMENT: Consider remarks in FARMER_STOCK instead

## Gaps / Missing
- CREDIT table: id, transaction_id, buyer_id, amount, due_date, status
- TRANSACTION_ITEM needs farmer_stock_id for traceability
- COMMISSION_RULE table for shop/product/plan commission config
- OWNER multi-shop reporting: clarify aggregation by user_id
- PRODUCT_PRICE_HISTORY table for price changes

## Market Price Flexibility
- Price is negotiable, not fixed
- 1 product can be sold at multiple prices (per transaction/item)
- Suggest: Remove price from PRODUCT, store price in FARMER_STOCK and TRANSACTION_ITEM

## Recommended ERD Changes
- Remove FARMER, BUYER, EMPLOYEE tables; use USER (role)
- Add CREDIT table
- Add COMMISSION_RULE table
- Add PRODUCT_PRICE_HISTORY table
- Add farmer_stock_id to TRANSACTION_ITEM
- Store price in FARMER_STOCK and TRANSACTION_ITEM
- Use created_by (user_id) for all entities
- Consider remarks in FARMER_STOCK instead of separate comment table

---

This file summarizes the ERD review, strengths, over-design, gaps, and recommended changes for KisaanCenter. Use it as a checklist for next ERD revision.
