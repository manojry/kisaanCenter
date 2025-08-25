
# KisaanCenter Superadmin Features & Capabilities (Detailed)

## What Superadmin Has
- Full access to all shops, owners, users, plans, products, transactions, payments, expenses, and audit logs.
- System-wide dashboard with analytics, alerts, and quick actions.
- Role-based access to delegate certain admin tasks to trusted managers.
- Controls for compliance, security, regulatory actions, and business rules.
- Audit logs for every entity and action, with search and export capabilities.
- Multi-region, multi-currency, and multi-language support.

## What Superadmin Can Do

### User & Shop Management
- Create, update, suspend, or delete owner accounts and shops.
- Assign, upgrade, downgrade, or suspend plans and features for shops.
- Activate, deactivate, or suspend owners, shops, and users (including employees, farmers, buyers).
- Transfer shop ownership and migrate all related data.
- Set shop limits (users, products, transactions, storage).
- Bulk import/export users and shop data for onboarding or migration.
- ERD: Supported via SUPERADMIN, USER, SHOP, PLAN entities.

### Plan & Feature Management
- Create, update, and manage plans (Basic, Premium, Enterprise, custom).
- Assign features to plans (e.g., advanced analytics, bulk SMS, multi-shop management).
- Set plan pricing, expiry, and renewal rules.
- Monitor plan usage and send alerts for approaching limits.
- Suspend or reactivate plans for compliance or business reasons.
- ERD: Supported via PLAN, SHOP.

### Compliance, Security & Regulatory Actions
- Monitor activity logs for suspicious actions or policy violations.
- Freeze shops or users for investigation; restrict all actions during freeze.
- Generate compliance and audit reports for regulatory checks.
- Set and enforce business rules (e.g., commission caps, payment terms).
- Manage data retention, privacy, and export requests.
- ERD: Supported via AUDIT_LOG, status fields.

### System Configuration & Integrations
- Configure payment gateways, currencies, tax rates, and integrations (SMS, email, accounting).
- Set up multi-region and multi-currency operations.
- Manage system-wide notification and alert settings.
- Enable/disable features globally or per shop/plan.
- ERD: Supported via PLAN, SHOP, additional config tables.

### Data & Analytics
- Access system-wide analytics: sales, payments, credits, disputes, returns, expenses, user activity.
- Drill down into shop, owner, product, or user-level data.
- Export analytics and reports for business intelligence.
- Schedule automated report delivery to stakeholders.
- ERD: Supported via all major entities.

### Dispute & Issue Resolution
- Review and resolve disputes between owners, farmers, buyers, or employees.
- Access audit logs and transaction history for evidence.
- Mediate and document resolution steps.
- ERD: Supported via AUDIT_LOG, TRANSACTION, PAYMENT.

### Communication & Notifications
- Send system-wide or targeted messages/alerts to owners, shops, or users.
- Configure notification templates for compliance, payment reminders, plan expiry, etc.
- ERD: Can be supported via additional notification/message tables.

### Edge Cases & Advanced Scenarios
- Handle mass shop onboarding for enterprise clients.
- Manage regulatory freeze and investigation workflows.
- Oversee shop transfer, plan migration, and data archiving.
- Support for custom business rules per region or client.
- Monitor and manage system health, backups, and disaster recovery.
- ERD: Supported via status fields, audit logs, and relationships.

---

Superadmin is the highest authority in KisaanCenter, responsible for system integrity, business onboarding, compliance, enterprise management, and advanced configuration. All features above are supported or can be supported by the current ERD, with minor extensions for messaging/notifications if needed.
