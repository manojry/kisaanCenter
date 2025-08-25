
# KisaanCenter Owner Features & Capabilities

## Extensibility for Future Markets

KisaanCenter is designed to support not only the flower market, but also future extensions for fruits, vegetables, grains, and other agricultural products. The only change required for such extensions is updating the product category (e.g., adding new entries to the CATEGORY table and updating product types). All features, workflows, and entities remain the same, ensuring seamless scalability and maintainability.

## Product Selection Per Owner/Shop

Each owner/shop can independently decide which products to offer for sale. Owners can select any number of products from any available category (e.g., flowers, fruits, vegetables, grains). For example, one owner may choose to sell only a single product, while another may offer twenty or more products. Product selection is fully flexible and managed per shop, supporting diverse business models and inventory sizes.

---

## What Owner Has

## What Owner Can Do


# KisaanCenter Owner Features & Capabilities (Detailed)

## What Owner Has
- Full access to their shop(s), users, products, transactions, payments, expenses, plans, and audit logs.
- Personalized dashboard with analytics, alerts, and quick actions.
- Role-based permissions for employees and managers.

## What Owner Can Do

### User Management
- Add, update, and remove employees, farmers, and buyers.
- Assign roles and permissions (e.g., cashier, manager, loader).
- View user activity logs and performance reports.
- Suspend or reactivate users as needed.
- ERD: Supported via USER, SHOP, EMPLOYEE, FARMER, BUYER entities.

### Product & Inventory Management

- Select products to sell from a master list provided by the superadmin (e.g., all available flowers, fruits, vegetables, grains).
- On the dashboard, choose which products to offer for sale each day (e.g., Owner A selects 'rose' and 'marigold', Owner B selects 'jasmine', 'lily', and 'apple').
- Set prices, units, and descriptions for selected products.
- Record deliveries from farmers, including multiple products per delivery.
- Track stock levels, unsold/discarded products, and expiry dates for selected products.
- Set reorder alerts for low stock.
- Categorize products (e.g., seasonal, premium, bulk).
- ERD: Supported via PRODUCT, CATEGORY, FARMER_STOCK, FARMER_STOCK_COMMENT.

**Example:**
Superadmin adds 'rose', 'marigold', 'jasmine', 'apple', 'wheat' to the master product list. Owner A selects 'rose', 'marigold' for today's sales; Owner B selects 'jasmine', 'apple', 'wheat'. Each owner manages only the products they select, but can change their selection daily.

### Sales & Transaction Management
- Record sales, including multi-product transactions and discounts.
- Handle credit sales, partial payments, and payment reminders.
- Link each sale to buyer, farmer, and product.
- Process returns/exchanges, update stock and payments.
- View transaction history, filter by date, product, buyer, or farmer.
- ERD: Supported via TRANSACTION, TRANSACTION_ITEM, PAYMENT.

### Payment & Commission Management
- Pay farmers (full or partial), track pending payments.
- View commission breakdowns per transaction and per farmer.
- Handle overpayments/underpayments, reconcile with audit logs.
- Set custom commission rates for special products or farmers.
- ERD: Supported via PAYMENT, TRANSACTION, AUDIT_LOG.

### Expense & Financial Management
- Record shop expenses (wages, rent, utilities, supplies).
- Attach receipts or notes to expense entries.
- Generate profit/loss statements and cash flow reports.
- Set budget limits and receive alerts for overspending.
- ERD: Supported via EXPENSE.

### Reporting & Analytics
- Generate sales, payment, expense, and inventory reports.
- Visualize trends (e.g., best-selling flowers, peak sales times).
- Export data to Excel/CSV for further analysis.
- Schedule automated report delivery via email/SMS.
- ERD: Supported via all major entities.

### Plan & Feature Management
- View current plan and available features.
- Request plan upgrades or feature add-ons (e.g., bulk SMS, advanced analytics).
- Monitor usage limits (e.g., number of users, transactions, storage).
- ERD: Supported via PLAN, SHOP.

### Compliance & Audit
- Access audit logs for all actions (user changes, payments, stock updates).
- Generate compliance reports for regulatory checks.
- Respond to superadmin requests for investigation or data freeze.
- ERD: Supported via AUDIT_LOG.

### Multi-Shop & Multi-Region Management
- Manage multiple shops from a single dashboard.

- Transfer selected products, users, or funds between shops.
- Support for multi-currency and region-specific pricing for selected products.
- ERD: Supported via SHOP, PRODUCT, USER.

### Communication & Notifications
- Send messages or alerts to employees, farmers, or buyers.
- Receive system notifications for low stock, pending payments, disputes, or compliance issues.
- ERD: Can be supported via additional notification/message tables.

### Edge Cases & Advanced Scenarios
- Handle buyer defaults: restrict credit, flag risky buyers.
- Manage farmer disputes: review audit logs, adjust payments.
- Process bulk imports/exports for onboarding or migration.
- Shop transfer: update owner, migrate all related data.
- Regulatory freeze: suspend shop, restrict all actions, maintain audit trail.
- ERD: Supported via status fields, audit logs, and relationships.

---

Owner is responsible for day-to-day shop operations, user management, and business growth within KisaanCenter. All features above are supported or can be supported by the current ERD, with minor extensions for messaging/notifications if needed. This covers day-to-day, advanced, and edge-case scenarios for owners in KisaanCenter.
Owner is responsible for day-to-day shop operations, user management, and business growth within KisaanCenter.
