# KisaanCenter Owner Journey (with Superadmin)

## 1. Superadmin Setup & Enterprise Management
A superadmin registers on KisaanCenter and gains access to enterprise-level controls. The superadmin can:
- Create owners and their shops
- Assign plans and features to each shop
- Set active/inactive status for owners, shops, and plans
- Manage system-wide configurations and compliance

## 2. Owner Creation & Shop Assignment
The superadmin creates a new owner account and sets up their shop. The owner is linked to the shop, and a plan is assigned (e.g., Basic, Premium, Enterprise) with specific features enabled.


## 3. Adding Users
The owner (created by the superadmin) adds users to their shop, assigning each a role (employee, farmer, buyer). All users are managed in a unified USER table, with role-based permissions and shop assignment. If extra fields are needed for a role, a profile extension can be added.


## 4. Receiving Deliveries
Farmers deliver products to the shop. The owner or employees record the delivery, noting the quantity, type, and negotiated price per batch. The system creates a FARMER_STOCK entry for each delivery, supporting multiple products per farmer and flexible pricing. Remarks can be added directly to the stock entry.


## 5. Managing Sales
Throughout the day, buyers purchase products. Employees record each sale, updating the stock and linking the transaction to the buyer and the source farmer stock for traceability. Each TRANSACTION_ITEM references the specific FARMER_STOCK used. The system automatically calculates commissions (using COMMISSION_RULE) and updates payment records. Prices can be set per sale, supporting negotiation and market variability.


## 6. End-of-Day Review & Comments
At the end of the day, the owner reviews unsold stock and adds remarks directly to the FARMER_STOCK entry (e.g., "50kg unsold, will try to sell tomorrow"). Unsold products can be marked as discarded if needed.


## 7. Payment Management
The owner tracks payments to farmers, even if buyers pay late. The system shows pending and completed payments, and tracks credit status. Disputes can be resolved using audit logs and transaction history.

## 8. Expense Tracking
The owner records shop expenses (wages, rent, utilities, etc.) in the system. This helps manage profitability and prepare for tax or regulatory reporting.


## 9. Reporting & Analysis
The owner generates reports on sales, payments, expenses, stock, credit, commission, and price history. These reports help identify trends, manage inventory, and plan for busy seasons.

## 10. Multi-Shop Management (if applicable)
If the owner operates multiple shops, they can view and manage each shop’s data separately, with superadmin oversight.

## 11. Offboarding & Data Management
If the owner decides to close the shop or transfer ownership, the superadmin can archive or migrate data securely.

---

## What Can Happen?
- **Successful Day:** Most flowers sold, payments tracked, happy farmers and buyers.
- **Credit Risk:** Buyers delay payments, owner must manage cash flow and follow up.
- **Stock Spoilage:** Unsold flowers discarded, loss recorded, owner reviews causes.
- **Dispute:** Farmer questions payment, owner resolves using system records.
- **Seasonal Spike:** High sales during festivals, system scales to handle volume.
- **Regulatory Check:** Owner or superadmin generates audit logs and reports for compliance.
- **Plan Upgrade/Downgrade:** Superadmin changes shop plan/features as needed.
- **Shop Suspension/Activation:** Superadmin can activate or suspend shops and owners for compliance or business reasons.

---

KisaanCenter now supports enterprise-level management, with superadmin controls for onboarding, plan assignment, feature management, and compliance—making the system robust, scalable, and ready for any scenario.
