# KisaanCenter Owner & Superadmin Journey (Enterprise)

## 1. Superadmin Setup & Enterprise Management
A superadmin registers on KisaanCenter and gains access to enterprise-level controls. The superadmin can:
- Create owners and their shops
- Assign plans and features to each shop
- Set active/inactive status for owners, shops, and plans
- Manage system-wide configurations and compliance

## 2. Owner Creation & Shop Assignment
The superadmin creates a new owner account and sets up their shop. The owner is linked to the shop, and a plan is assigned (e.g., Basic, Premium, Enterprise) with specific features enabled.

## 3. Adding Users
The owner (created by the superadmin) adds employees, farmers, and buyers to their shop. Each user is assigned to the shop, ensuring all transactions and records are tied to the correct business.

## 4. Receiving Deliveries
Farmers deliver flowers to the shop. The owner or employees record the delivery, noting the quantity and type of flowers. The system creates a stock entry for each delivery, supporting multiple products per farmer.

## 5. Managing Sales
Throughout the day, buyers purchase flowers. Employees record each sale, updating the stock and linking the transaction to the buyer and farmer. The system automatically calculates commissions and updates payment records.

### Scenario: Credit Sales & Partial Payments
Sometimes, buyers pay only part of their bill immediately, with the rest pending as credit. The system marks these transactions as “credit,” and tracks outstanding payments. The owner may pay farmers a partial amount, with the remaining owed tracked until buyers pay off their credit.

### Scenario: Multiple Products & Buyers
A farmer may deliver several types of flowers, and multiple buyers can purchase any combination of products. Each transaction is tracked separately, and payment status is updated as buyers pay off their credit.

## 6. End-of-Day Review & Comments
At the end of the day, the owner reviews unsold stock and adds comments (e.g., "50kg unsold, will try to sell tomorrow"). Unsold flowers can be marked as discarded if needed.

## 7. Payment Management
The owner tracks payments to farmers, even if buyers pay late. The system shows pending and completed payments, ensuring transparency. Disputes can be resolved using audit logs and transaction history.

## 8. Expense Tracking
The owner records shop expenses (wages, rent, utilities, etc.) in the system. This helps manage profitability and prepare for tax or regulatory reporting.

## 9. Reporting & Analysis
The owner generates reports on sales, payments, expenses, and stock. These reports help identify trends, manage inventory, and plan for busy seasons.

## 10. Multi-Shop Management (if applicable)
If the owner operates multiple shops, they can view and manage each shop’s data separately, with superadmin oversight.

## 11. Offboarding & Data Management
If the owner decides to close the shop or transfer ownership, the superadmin can archive or migrate data securely.

---

## What Can Happen?
- **Successful Day:** Most flowers sold, payments tracked, happy farmers and buyers.
- **Credit Risk:** Buyers delay payments, owner must manage cash flow and follow up.
- **Partial Payments:** Buyers pay part of their bill, owner pays farmers partially, system tracks outstanding amounts.
- **Stock Spoilage:** Unsold flowers discarded, loss recorded, owner reviews causes.
- **Dispute:** Farmer questions payment, owner resolves using system records.
- **Seasonal Spike:** High sales during festivals, system scales to handle volume.
- **Regulatory Check:** Owner or superadmin generates audit logs and reports for compliance.
- **Plan Upgrade/Downgrade:** Superadmin changes shop plan/features as needed.
- **Shop Suspension/Activation:** Superadmin can activate or suspend shops and owners for compliance or business reasons.

---

KisaanCenter now supports enterprise-level management, with superadmin controls for onboarding, plan assignment, feature management, and compliance—making the system robust, scalable, and ready for any scenario.

---

# Additional Edge Cases & Technical Details

## Edge Cases
- **Buyer Default:** A buyer repeatedly fails to pay their credit. The system flags the buyer, restricts further credit, and notifies the owner and superadmin.
- **Farmer Overpayment/Underpayment:** Owner accidentally pays a farmer more or less than owed. Audit logs and payment reconciliation features help correct errors.
- **Product Returns/Exchanges:** Buyer returns flowers due to quality issues. The system records the return, updates stock, and adjusts payments/commissions.
- **Shop Transfer:** Ownership of a shop is transferred to another user. Superadmin manages the transfer, ensuring all data and permissions are updated.
- **Plan Expiry/Upgrade:** Shop’s plan expires or is upgraded. Features and limits are updated automatically, and users are notified.
- **Bulk Data Import/Export:** Superadmin or owner imports historical data or exports reports for analysis or compliance.
- **Multi-currency Support:** Shop operates in different regions; system supports multiple currencies and conversion rates.
- **Regulatory Freeze:** Superadmin freezes a shop for investigation; all transactions are suspended until resolved.

## Technical Details
- **Data Model:**
	- Multi-tenant architecture with clear data isolation (shop_id, owner_user_id, superadmin_id).
	- All payments have explicit `payment_type` and `outstanding_amount` fields.
	- Transactions support multiple products via `TRANSACTION_ITEM`.
	- Audit logs track all changes for compliance and dispute resolution.
- **Security:**
	- Role-based access control (superadmin, owner, employee, farmer, buyer).
	- Data encryption for sensitive fields (passwords, payment info).
	- Activity monitoring and alerts for suspicious actions.
- **Scalability:**
	- Database indexing for fast queries on transactions, payments, and stock.
	- Support for high transaction volumes during peak seasons.
- **APIs & Integrations:**
	- RESTful APIs for mobile/web apps.
	- Integration with payment gateways for online payments.
	- Export to Excel/CSV for reporting.
- **Testing & Validation:**
	- Automated tests for all workflows (delivery, sales, payments, credits, returns).
	- Edge case scenarios documented for QA.

## Example: Complex Day
**Morning:**
- Farmer A delivers 100kg roses, 50kg marigold.
- Owner records delivery; system creates two stock entries.

**Sales:**
- Buyer 1 buys 60kg roses, pays ₹3,000 (₹1,000 credit).
- Buyer 2 buys 20kg marigold, pays full amount.
- Buyer 3 buys 40kg roses, pays nothing (full credit).

**End of Day:**
- Owner reviews stock: 0kg roses left, 30kg marigold unsold.
- Owner adds comment: "30kg marigold unsold, will try to sell tomorrow."

**Payments:**
- Shop receives ₹3,000 cash, ₹1,000 credit pending, ₹800 from Buyer 2.
- Owner pays Farmer A ₹3,500 (partial), with ₹1,000 pending until buyers pay credit.

**Returns:**
- Buyer 1 returns 10kg roses due to quality; stock updated, payment adjusted.

**Audit & Reports:**
- Owner generates report: sales, payments, outstanding credits, returns.
- Superadmin reviews audit logs for compliance.

**Plan Upgrade:**
- Owner requests more features; superadmin upgrades shop plan, enabling advanced analytics and bulk SMS notifications.

**Regulatory Freeze:**
- Superadmin freezes shop due to compliance issue; all transactions suspended, investigation started.

---
