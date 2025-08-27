# KisaanCenter Frontend: Complete System Architecture & Implementation Guide

## 1. Overview
This document describes how to design and implement a modular, decoupled React frontend for the complete KisaanCenter Market Management System, based on the ERD and existing backend endpoints. The system handles complex multi-party transactions, stock management, credit systems, and financial workflows.

## 2. Architecture Principles
- **Feature-based modularity**: Each business domain is a self-contained module with its own components, hooks, API, and types.
- **Domain-driven design**: Features align with ERD entities and business workflows.
- **Separation of concerns**: UI, API, state, and business logic are completely decoupled.
- **Reusable shared code**: Common components, hooks, and services are shared across features.
- **Type safety**: Full TypeScript implementation with strict type checking.
- **Real-time updates**: WebSocket integration for live transaction status updates.
- **Role-based access**: Dynamic UI based on user roles (SUPERADMIN, OWNER, FARMER, BUYER, EMPLOYEE, GUEST).

## 3. Complete Folder Structure (Based on ERD Entities)
```
src/
  app/                          # App-level setup
    App.tsx
    index.tsx
    routes.tsx
    theme.ts
    providers.tsx               # All context providers
  features/                     # Feature modules (one per ERD entity/domain)
    auth/                       # Authentication & session management
      components/               # LoginForm, RoleSelector, etc.
      hooks/                   # useAuth, usePermissions, etc.
      api.ts                   # Login, logout, refresh token
      types.ts                 # User, Session types
      context.tsx              # AuthContext
      index.ts
    user/                       # User management (CRUD for all roles)
      components/               # UserList, UserForm, UserProfile, etc.
      hooks/                   # useUsers, useCreateUser, etc.
      api.ts                   # User CRUD operations
      types.ts                 # User interface, UserRole enum
      index.ts
    shop/                       # Shop management
      components/               # ShopList, ShopForm, ShopDashboard, etc.
      hooks/                   # useShops, useCreateShop, etc.
      api.ts                   # Shop CRUD operations
      types.ts                 # Shop interface
      index.ts
    product/                    # Product management
      components/               # ProductList, ProductForm, CategoryManager, etc.
      hooks/                   # useProducts, useCategories, etc.
      api.ts                   # Product CRUD, categories
      types.ts                 # Product, Category interfaces
      index.ts
    stock/                      # Farmer stock management
      components/               # StockList, StockForm, StockAdjustment, etc.
      hooks/                   # useFarmerStock, useStockAdjustments, etc.
      api.ts                   # Stock operations
      types.ts                 # FarmerStock, StockAdjustment interfaces
      index.ts
    transaction/                # Transaction management (core business logic)
      components/               # TransactionForm, TransactionList, TransactionDetails, CompletionTracker, etc.
      hooks/                   # useTransactions, useCreateTransaction, etc.
      api.ts                   # Transaction CRUD, completion tracking
      types.ts                 # Transaction, TransactionItem, CompletionStatus interfaces
      utils.ts                 # Transaction completion logic
      index.ts
    payment/                    # Payment management
      components/               # PaymentForm, PaymentHistory, PaymentMethods, etc.
      hooks/                   # usePayments, usePaymentMethods, etc.
      api.ts                   # Payment operations
      types.ts                 # Payment, PaymentMethod interfaces
      index.ts
    credit/                     # Credit management system
      components/               # CreditList, CreditDetails, CreditRepayment, etc.
      hooks/                   # useCredits, useCreditDetails, etc.
      api.ts                   # Credit operations
      types.ts                 # Credit, CreditDetail interfaces
      index.ts
    farmer-payment/             # Farmer payment/settlements
      components/               # FarmerPaymentForm, PaymentHistory, etc.
      hooks/                   # useFarmerPayments, etc.
      api.ts                   # Farmer payment operations
      types.ts                 # FarmerPayment interface
      index.ts
    commission/                 # Commission management
      components/               # CommissionRules, CommissionCalculator, etc.
      hooks/                   # useCommissionRules, etc.
      api.ts                   # Commission operations
      types.ts                 # CommissionRule interface
      index.ts
    expense/                    # Expense management
      components/               # ExpenseForm, ExpenseList, ExpenseCategories, etc.
      hooks/                   # useExpenses, useExpenseCategories, etc.
      api.ts                   # Expense operations
      types.ts                 # Expense, ExpenseCategory interfaces
      index.ts
    subscription/               # Subscription & plan management
      components/               # PlanList, PlanForm, SubscriptionDashboard, etc.
      hooks/                   # usePlans, useSubscriptions, etc.
      api.ts                   # Subscription operations
      types.ts                 # Plan, Subscription interfaces
      index.ts
    audit/                      # Audit log & compliance
      components/               # AuditLogViewer, ComplianceReport, etc.
      hooks/                   # useAuditLogs, etc.
      api.ts                   # Audit operations
      types.ts                 # AuditLog interface
      index.ts
    admin/                      # Super admin features
      components/               # AdminDashboard, ShopOverrides, BulkOperations, etc.
      hooks/                   # useShopOverrides, useBulkOperations, etc.
      api.ts                   # Super admin operations
      types.ts                 # Override, BulkOperation interfaces
      index.ts
    dashboard/                  # Role-based dashboards
      components/               # OwnerDashboard, FarmerDashboard, BuyerDashboard, etc.
      hooks/                   # useDashboardData, etc.
      api.ts                   # Dashboard analytics
      types.ts                 # Dashboard data interfaces
      index.ts
    reports/                    # Financial & business reports
      components/               # SalesReport, CommissionReport, CreditReport, etc.
      hooks/                   # useReports, etc.
      api.ts                   # Report generation
      types.ts                 # Report interfaces
      index.ts
  components/                   # Shared UI components
    ui/                        # Basic UI components
      Button.tsx
      Input.tsx
      Modal.tsx
      Table.tsx
      Form.tsx
      StatusBadge.tsx
      LoadingSpinner.tsx
    layout/                    # Layout components
      Header.tsx
      Sidebar.tsx
      Layout.tsx
      Navigation.tsx
    forms/                     # Reusable form components
      FormField.tsx
      FormValidation.tsx
      FormButtons.tsx
    charts/                    # Chart components for dashboards
      SalesChart.tsx
      CommissionChart.tsx
      StockChart.tsx
  hooks/                       # Global custom hooks
    useApi.ts                  # Generic API hook
    usePermissions.ts          # Role-based permissions
    useWebSocket.ts            # Real-time updates
    useLocalStorage.ts         # Local storage management
    usePagination.ts           # Pagination logic
    useFormValidation.ts       # Form validation
  services/                    # API clients & utilities
    api.ts                     # Axios instance & interceptors
    endpoints.ts               # API endpoint constants
    websocket.ts               # WebSocket service
    storage.ts                 # Local/session storage
    validation.ts              # Form validation schemas
    permissions.ts             # Permission checking utilities
  context/                     # Global context providers
    AuthContext.tsx            # Authentication state
    ThemeContext.tsx           # UI theme management
    PermissionContext.tsx      # Role-based permissions
    WebSocketContext.tsx       # Real-time updates
  utils/                       # Utility functions
    formatting.ts              # Date, currency, number formatting
    calculations.ts            # Business calculations (commission, etc.)
    constants.ts               # Application constants
    helpers.ts                 # General helper functions
    transactions.ts            # Transaction completion logic
  types/                       # Global TypeScript types
    api.ts                     # API response types
    common.ts                  # Common interfaces
    enums.ts                   # All system enums
    entities.ts                # Core entity types matching ERD
  pages/                       # Top-level route pages (composition layer)
    LoginPage.tsx
    DashboardPage.tsx
    TransactionsPage.tsx
    StockPage.tsx
    PaymentsPage.tsx
    ReportsPage.tsx
    AdminPage.tsx
    etc.
  assets/                      # Static assets
    images/
    icons/
    styles/
  tests/                       # Testing utilities
    mocks/
    utils/
    fixtures/
```## 4. API Endpoints Coverage (Based on ERD & Available Endpoints)

### Core Entity Management
- `GET/POST/PUT/DELETE /api/v1/users/` — User management (all roles)
- `GET/POST/PUT/DELETE /api/v1/shops/` — Shop management
- `GET/POST/PUT/DELETE /api/v1/products/` — Product management
- `GET/POST/PUT/DELETE /api/v1/categories/` — Product categories

### Stock Management
- `GET/POST/PUT /api/v1/farmer-stock/` — Farmer stock operations
- `POST /api/v1/stock-adjustments/` — Stock corrections
- `GET /api/v1/stock-status/{shop_id}` — Real-time stock status

### Transaction Management (Core Business Logic)
- `GET/POST/PUT /api/v1/transactions/` — Transaction CRUD
- `GET/POST/PUT /api/v1/transaction-items/` — Transaction item details
- `PUT /api/v1/transactions/{id}/completion` — Update completion status
- `GET /api/v1/transactions/{id}/completion-status` — Get completion tracking

### Payment Systems
- `GET/POST /api/v1/payments/` — Payment operations
- `GET/POST /api/v1/farmer-payments/` — Farmer settlements
- `GET /api/v1/payment-methods/` — Available payment methods

### Credit Management
- `GET/POST/PUT /api/v1/credits/` — Credit operations
- `GET /api/v1/credit-details/{credit_id}` — Credit breakdown
- `POST /api/v1/credits/{id}/repayment` — Credit repayments

### Commission & Financial
- `GET/POST/PUT /api/v1/commission-rules/` — Commission configuration
- `GET /api/v1/expenses/` — Expense tracking
- `GET /api/v1/expense-categories/` — Expense categories

### Subscription Management
- `GET/POST/PUT /api/v1/subscriptions/plans` — Plan management
- `GET/POST/PUT /api/v1/subscriptions/` — Subscription operations
- `PUT /api/v1/subscriptions/{id}/upgrade` — Plan upgrades
- `GET /api/v1/subscriptions/shop/{shop_id}/features` — Feature controls

### Super Admin Controls
- `PUT /api/v1/admin/shops/{shop_id}/plan-overrides` — Custom shop pricing
- `PUT /api/v1/admin/shops/{shop_id}/status` — Enable/disable shops
- `POST /api/v1/admin/bulk/plan-changes` — Bulk operations
- `GET /api/v1/admin/analytics/shop-risk-assessment` — Business analytics
- `PUT /api/v1/admin/users/{user_id}/force-password-reset` — Password management

### Audit & Compliance
- `GET /api/v1/audit-logs/` — Audit trail viewing
- `GET /api/v1/reports/compliance` — Compliance reports

### Real-time & Analytics
- `GET /api/v1/dashboard/{role}` — Role-based dashboard data
- `GET /api/v1/analytics/sales` — Sales analytics
- `GET /api/v1/analytics/commissions` — Commission analytics
- `WebSocket /ws/transactions` — Real-time transaction updates

## 5. Implementation Strategy & Core Features

### A. Transaction Completion System (Most Critical Feature)
Based on the ERD's three-checkbox completion model:

**Transaction Types (`features/transaction/types.ts`)**
```ts
export interface Transaction {
  id: string;
  shop_id: string;
  buyer_user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  
  // Three-checkpoint completion model
  buyer_paid_amount: number;
  farmer_paid_amount: number;
  commission_confirmed: boolean;
  completion_status: 'pending' | 'partial' | 'complete';
  
  // Financial details
  commission_rate: number;
  commission_amount: number;
  total_amount: number;
  
  // Relationships
  transaction_items: TransactionItem[];
  payments: Payment[];
  farmer_payments: FarmerPayment[];
}

export interface TransactionCompletionStatus {
  buyer_payment_complete: boolean;
  farmer_payment_complete: boolean;
  commission_confirmed: boolean;
  overall_status: 'pending' | 'partial' | 'complete';
  next_actions: string[];
}
```

**Transaction Completion Hook (`features/transaction/hooks/useTransactionCompletion.ts`)**
```ts
export function useTransactionCompletion(transactionId: string) {
  const queryClient = useQueryClient();
  
  const { data: status } = useQuery(
    ['transaction-completion', transactionId],
    () => fetchTransactionCompletionStatus(transactionId),
    { refetchInterval: 5000 } // Real-time updates
  );
  
  const updateCompletion = useMutation(updateTransactionCompletion, {
    onSuccess: () => {
      queryClient.invalidateQueries(['transaction-completion', transactionId]);
      queryClient.invalidateQueries(['transactions']);
    }
  });
  
  return { status, updateCompletion };
}
```

**Transaction Completion Component (`features/transaction/components/CompletionTracker.tsx`)**
```tsx
export function CompletionTracker({ transaction }: { transaction: Transaction }) {
  const { status, updateCompletion } = useTransactionCompletion(transaction.id);
  
  return (
    <div className="completion-tracker">
      <h3>Transaction Completion Status</h3>
      
      <div className="checkboxes">
        <div className={`checkbox ${status?.buyer_payment_complete ? 'complete' : 'pending'}`}>
          ✅ Buyer Payment: ₹{transaction.buyer_paid_amount} / ₹{transaction.total_amount}
        </div>
        
        <div className={`checkbox ${status?.farmer_payment_complete ? 'complete' : 'pending'}`}>
          ✅ Farmer Payment: ₹{transaction.farmer_paid_amount} / ₹{transaction.total_amount - transaction.commission_amount}
        </div>
        
        <div className={`checkbox ${transaction.commission_confirmed ? 'complete' : 'pending'}`}>
          <Checkbox 
            checked={transaction.commission_confirmed}
            onChange={(checked) => updateCompletion.mutate({ 
              id: transaction.id, 
              commission_confirmed: checked 
            })}
            disabled={!canConfirmCommission(transaction)}
          />
          Commission Confirmed: ₹{transaction.commission_amount}
        </div>
      </div>
      
      <div className={`overall-status ${status?.overall_status}`}>
        Status: {status?.overall_status.toUpperCase()}
      </div>
      
      {status?.next_actions.length > 0 && (
        <div className="next-actions">
          <h4>Next Actions:</h4>
          <ul>
            {status.next_actions.map(action => <li key={action}>{action}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### B. Role-Based Access Control (`features/auth/`)

**Permission Hook (`features/auth/hooks/usePermissions.ts`)**
```ts
export function usePermissions() {
  const { user } = useAuth();
  
  const can = (action: string, resource: string) => {
    if (user?.role === 'SUPERADMIN') return true;
    
    const permissions = ROLE_PERMISSIONS[user?.role || 'GUEST'];
    return permissions.includes(`${action}:${resource}`);
  };
  
  const canAccessShop = (shopId: string) => {
    if (user?.role === 'SUPERADMIN') return true;
    return user?.shop_id === shopId;
  };
  
  return { can, canAccessShop, user };
}
```

**Protected Route Component (`components/layout/ProtectedRoute.tsx`)**
```tsx
export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole 
}: ProtectedRouteProps) {
  const { can, user } = usePermissions();
  
  if (!user) return <Navigate to="/login" />;
  
  if (requiredRole && user.role !== requiredRole) {
    return <div>Access Denied</div>;
  }
  
  if (requiredPermission && !can(requiredPermission.action, requiredPermission.resource)) {
    return <div>Access Denied</div>;
  }
  
  return <>{children}</>;
}
```

### C. Real-time Updates (`services/websocket.ts`)

```ts
export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  
  connect(token: string) {
    this.ws = new WebSocket(`ws://localhost:8000/ws/transactions?token=${token}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.notifyListeners(data.type, data.payload);
    };
  }
  
  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}
```## 6. Best Practices Followed
## 6. Best Practices Followed
**Feature isolation**: All logic for a domain in its own folder.
**API abstraction**: All API calls in one file per feature.
**Type safety**: All data is typed.
**React Query**: For data fetching and cache.
**Form validation**: With Formik/Yup.
**No business logic in UI**: All logic in hooks/services.
**Reusable components**: For forms, lists, etc.
**Accessibility**: All UI must be keyboard and screen-reader accessible.
**Internationalization**: Support for multiple languages.
**Documentation**: Every feature and shared module must have a README.md.

## 7. Extending for Other Features
Add new features as new folders in `features/`.
Each feature manages its own API, types, hooks, and components.
Shared code lives in `components/`, `services/`, `context/`, and `utils/`.
Update documentation and tests for every new feature.

## 8. Testing Strategy

- **Unit tests:** For all components, hooks, and services.
- **Integration tests:** For feature workflows and API interactions.
- **End-to-end tests:** For critical user journeys (login, transaction, payment).
- **Coverage:** Aim for >90% coverage per feature.

## 9. Continuous Improvement

- Regularly audit code for modularity, test coverage, and documentation.
- Use automated tools (lint, prettier, jest, cypress) in CI/CD.
- Review and update architecture as business needs evolve.

---
This improved guide ensures your frontend remains scalable, maintainable, accessible, and testable as you grow.

---
This plan ensures a scalable, maintainable, and testable frontend for plan management and all future features.
kisaancenter-frontend/
├── public/
│   └── index.html
├── src/
│   ├── app/                        # App-level setup (providers, routing, theme)
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── routes.tsx
│   │   └── theme.ts
│   ├── features/                   # Feature-based modules (decoupled)
│   │   ├── auth/                   # Authentication & user session
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── shop/                   # Shop management
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── store/                  # Store management (if needed)
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── farmer/
│   │   ├── buyer/
│   │   ├── product/
│   │   ├── transaction/
│   │   ├── subscription/
│   │   ├── admin/                  # Super admin features
│   │   └── ... (other features)
│   ├── components/                 # Shared UI components (buttons, modals, etc.)
│   ├── hooks/                      # Global custom hooks
│   ├── services/                   # API clients, utils (axios, fetch, etc.)
│   ├── context/                    # Global context providers (auth, theme, etc.)
│   ├── utils/                      # Utility functions/helpers
│   ├── assets/                     # Images, fonts, static files
│   ├── types/                      # Global TypeScript types/interfaces
│   ├── pages/                      # Top-level route pages (composed from features)
│   ├── tests/                      # Global test utilities and mocks
│   └── index.tsx                   # Entry point
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

### D. Analytics & Reporting Dashboard (`features/analytics/`)

**Analytics Hook (`features/analytics/hooks/useAnalytics.ts`)**
```ts
export function useAnalytics(dateRange?: DateRange) {
  const { data: transactionAnalytics } = useQuery(
    ['analytics', 'transactions', dateRange],
    () => fetchTransactionAnalytics(dateRange)
  );
  
  const { data: revenueAnalytics } = useQuery(
    ['analytics', 'revenue', dateRange],
    () => fetchRevenueAnalytics(dateRange)
  );
  
  const { data: userAnalytics } = useQuery(
    ['analytics', 'users', dateRange],
    () => fetchUserAnalytics(dateRange)
  );
  
  return {
    transactions: transactionAnalytics,
    revenue: revenueAnalytics,
    users: userAnalytics
  };
}
```

**Analytics Charts (`features/analytics/components/`)**
```tsx
export function TransactionChart({ data }: { data: TransactionAnalytics }) {
  const chartData = data.daily_transactions.map(item => ({
    date: item.date,
    count: item.count,
    amount: item.total_amount
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#8884d8" />
        <Line type="monotone" dataKey="amount" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### E. Subscription & Feature Management (`features/subscription/`)

**Subscription Hook (`features/subscription/hooks/useSubscription.ts`)**
```ts
export function useSubscription(shopId?: string) {
  const { data: subscription } = useQuery(
    ['subscription', shopId],
    () => fetchShopSubscription(shopId)
  );
  
  const { data: plans } = useQuery('plans', fetchAllPlans);
  
  const updateSubscription = useMutation(updateShopSubscription, {
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription', shopId]);
    }
  });
  
  const checkFeatureAccess = (feature: string) => {
    return subscription?.plan.features.includes(feature) || false;
  };
  
  const checkLimits = () => {
    return {
      farmers: subscription?.farmer_count >= subscription?.plan.max_farmers,
      buyers: subscription?.buyer_count >= subscription?.plan.max_buyers,
      canAddMore: subscription?.plan.max_farmers > subscription?.farmer_count
    };
  };
  
  return {
    subscription,
    plans,
    updateSubscription,
    checkFeatureAccess,
    checkLimits
  };
}
```

**Feature Gate Component (`features/subscription/components/FeatureGate.tsx`)**
```tsx
export function FeatureGate({ 
  feature, 
  children, 
  fallback 
}: FeatureGateProps) {
  const { checkFeatureAccess } = useSubscription();
  
  if (!checkFeatureAccess(feature)) {
    return fallback || <div>This feature is not available in your plan</div>;
  }
  
  return <>{children}</>;
}
```

### F. Credit System (`features/credit/`)

**Credit Hook (`features/credit/hooks/useCredits.ts`)**
```ts
export function useCredits(userId?: string) {
  const { data: creditAccounts } = useQuery(
    ['credits', userId],
    () => fetchUserCredits(userId)
  );
  
  const addCredit = useMutation(addCreditToAccount, {
    onSuccess: () => {
      queryClient.invalidateQueries(['credits', userId]);
    }
  });
  
  const deductCredit = useMutation(deductCreditFromAccount, {
    onSuccess: () => {
      queryClient.invalidateQueries(['credits', userId]);
    }
  });
  
  const transferCredit = useMutation(transferCreditBetweenAccounts, {
    onSuccess: () => {
      queryClient.invalidateQueries(['credits']);
    }
  });
  
  return {
    creditAccounts,
    addCredit,
    deductCredit,
    transferCredit
  };
}
```

### G. File Upload & Management (`features/upload/`)

**Upload Hook (`features/upload/hooks/useFileUpload.ts`)**
```ts
export function useFileUpload() {
  const uploadFile = useMutation(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/v1/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    }
  );
  
  return { uploadFile };
}
```

### H. Audit Trail (`features/audit/`)

**Audit Hook (`features/audit/hooks/useAudit.ts`)**
```ts
export function useAudit(filters?: AuditFilters) {
  const { data: auditLogs } = useQuery(
    ['audit', filters],
    () => fetchAuditLogs(filters)
  );
  
  const createAuditLog = useMutation(createAuditEntry);
  
  return { auditLogs, createAuditLog };
}
```

## 6. Global Services & Utilities

### A. Error Handling (`services/error.ts`)

```ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

export function handleApiError(error: any) {
  if (error.response) {
    throw new ApiError(error.response.status, error.response.data.detail);
  }
  throw new Error('Network error');
}
```

### B. Validation (`utils/validation.ts`)

```ts
import * as yup from 'yup';

export const planSchema = yup.object().shape({
  name: yup.string().required('Plan name is required'),
  monthly_price: yup.number().min(0).required(),
  max_farmers: yup.number().min(1).required(),
});

export const transactionSchema = yup.object().shape({
  shop_id: yup.string().required(),
  buyer_user_id: yup.string().required(),
  total_amount: yup.number().min(0).required(),
  commission_rate: yup.number().min(0).max(100).required(),
});
```

---

# Backend Architecture Plan (Python/FastAPI)

## 1. Modular Backend Structure

```
backend/
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── requirements.txt               # Python dependencies
├── pyproject.toml                 # Python project configuration
├── Dockerfile                     # Container configuration
├── docker-compose.yml             # Multi-service setup
├── alembic.ini                    # Database migration config
├── pytest.ini                     # Test configuration
├── README.md                      # Backend documentation
├── scripts/                       # Deployment & setup scripts
│   ├── setup.py
│   ├── migrate.py
│   └── seed_data.py
├── migrations/                    # Alembic migration files
│   └── versions/
├── tests/                         # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   ├── fixtures/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── e2e/                       # End-to-end tests
├── src/                           # Source code
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── core/                      # Core application setup
│   │   ├── __init__.py
│   │   ├── config.py              # Configuration management
│   │   ├── database.py            # Database connection
│   │   ├── dependencies.py        # Dependency injection
│   │   ├── exceptions.py          # Custom exceptions
│   │   ├── middleware.py          # Custom middleware
│   │   ├── security.py            # Authentication & authorization
│   │   └── logging.py             # Logging configuration
│   ├── shared/                    # Shared utilities
│   │   ├── __init__.py
│   │   ├── models/                # Shared models & base classes
│   │   │   ├── __init__.py
│   │   │   ├── base.py            # SQLAlchemy base model
│   │   │   └── mixins.py          # Model mixins (timestamps, etc.)
│   │   ├── schemas/               # Shared Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── base.py            # Base schemas
│   │   │   └── common.py          # Common response schemas
│   │   ├── enums/                 # Application enums
│   │   │   ├── __init__.py
│   │   │   ├── user.py            # User-related enums
│   │   │   ├── transaction.py     # Transaction enums
│   │   │   └── subscription.py    # Subscription enums
│   │   ├── utils/                 # Utility functions
│   │   │   ├── __init__.py
│   │   │   ├── helpers.py         # General helpers
│   │   │   ├── validators.py      # Custom validators
│   │   │   ├── formatters.py      # Data formatters
│   │   │   └── crypto.py          # Encryption utilities
│   │   └── constants/             # Application constants
│   │       ├── __init__.py
│   │       ├── messages.py        # Response messages
│   │       └── defaults.py        # Default values
│   ├── features/                  # Feature-based modules
│   │   ├── __init__.py
│   │   ├── auth/                  # Authentication & user management
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # User, Role, Permission models
│   │   │   ├── schemas.py         # Auth-related schemas
│   │   │   ├── services.py        # Authentication logic
│   │   │   ├── dependencies.py    # Auth dependencies
│   │   │   ├── routes.py          # Auth endpoints
│   │   │   └── exceptions.py      # Auth-specific exceptions
│   │   ├── shops/                 # Shop management
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Shop, ShopUser models
│   │   │   ├── schemas.py         # Shop schemas
│   │   │   ├── services.py        # Shop business logic
│   │   │   ├── routes.py          # Shop endpoints
│   │   │   └── dependencies.py    # Shop-specific dependencies
│   │   ├── products/              # Product catalog
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Product, Category, Unit models
│   │   │   ├── schemas.py         # Product schemas
│   │   │   ├── services.py        # Product management logic
│   │   │   ├── routes.py          # Product endpoints
│   │   │   └── dependencies.py    # Product dependencies
│   │   ├── transactions/          # Transaction processing
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Transaction, TransactionItem models
│   │   │   ├── schemas.py         # Transaction schemas
│   │   │   ├── services.py        # Transaction business logic
│   │   │   ├── routes.py          # Transaction endpoints
│   │   │   ├── dependencies.py    # Transaction dependencies
│   │   │   └── completion.py      # Three-checkpoint completion logic
│   │   ├── payments/              # Payment processing
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Payment, FarmerPayment models
│   │   │   ├── schemas.py         # Payment schemas
│   │   │   ├── services.py        # Payment processing logic
│   │   │   ├── routes.py          # Payment endpoints
│   │   │   └── gateways/          # Payment gateway integrations
│   │   │       ├── __init__.py
│   │   │       ├── base.py        # Base payment gateway
│   │   │       ├── razorpay.py    # Razorpay integration
│   │   │       └── stripe.py      # Stripe integration
│   │   ├── credits/               # Credit system
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Credit, CreditTransaction models
│   │   │   ├── schemas.py         # Credit schemas
│   │   │   ├── services.py        # Credit management logic
│   │   │   ├── routes.py          # Credit endpoints
│   │   │   └── dependencies.py    # Credit dependencies
│   │   ├── subscriptions/         # Subscription management
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Subscription, Plan models
│   │   │   ├── schemas.py         # Subscription schemas
│   │   │   ├── services.py        # Subscription logic
│   │   │   ├── routes.py          # Subscription endpoints
│   │   │   ├── dependencies.py    # Subscription dependencies
│   │   │   └── features.py        # Feature gate management
│   │   ├── analytics/             # Analytics & reporting
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Analytics models
│   │   │   ├── schemas.py         # Analytics schemas
│   │   │   ├── services.py        # Analytics logic
│   │   │   ├── routes.py          # Analytics endpoints
│   │   │   └── aggregators.py     # Data aggregation logic
│   │   ├── audit/                 # Audit logging
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # AuditLog model
│   │   │   ├── schemas.py         # Audit schemas
│   │   │   ├── services.py        # Audit logging logic
│   │   │   ├── routes.py          # Audit endpoints
│   │   │   └── decorators.py      # Audit decorators
│   │   ├── uploads/               # File management
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Upload model
│   │   │   ├── schemas.py         # Upload schemas
│   │   │   ├── services.py        # File handling logic
│   │   │   ├── routes.py          # Upload endpoints
│   │   │   └── storage/           # Storage backends
│   │   │       ├── __init__.py
│   │   │       ├── local.py       # Local file storage
│   │   │       ├── s3.py          # AWS S3 storage
│   │   │       └── base.py        # Base storage interface
│   │   └── admin/                 # Super admin features
│   │       ├── __init__.py
│   │       ├── models.py          # Admin-specific models
│   │       ├── schemas.py         # Admin schemas
│   │       ├── services.py        # Admin business logic
│   │       ├── routes.py          # Admin endpoints
│   │       ├── dependencies.py    # Admin dependencies
│   │       └── permissions.py     # Admin permission logic
│   └── api/                       # API routing
│       ├── __init__.py
│       ├── v1/                    # API version 1
│       │   ├── __init__.py
│       │   ├── routes.py          # Main router setup
│       │   └── endpoints/         # Endpoint aggregation
│       │       ├── __init__.py
│       │       ├── auth.py        # Auth endpoint inclusion
│       │       ├── shops.py       # Shop endpoint inclusion
│       │       ├── products.py    # Product endpoint inclusion
│       │       ├── transactions.py # Transaction endpoint inclusion
│       │       ├── payments.py    # Payment endpoint inclusion
│       │       ├── credits.py     # Credit endpoint inclusion
│       │       ├── subscriptions.py # Subscription endpoint inclusion
│       │       ├── analytics.py   # Analytics endpoint inclusion
│       │       ├── audit.py       # Audit endpoint inclusion
│       │       ├── uploads.py     # Upload endpoint inclusion
│       │       └── admin.py       # Admin endpoint inclusion
│       └── dependencies.py        # Global API dependencies
└── logs/                          # Application logs
    ├── app.log
    ├── error.log
    └── access.log
```

## 2. Key Architecture Principles

### A. Feature-Based Organization
Each feature module (`features/auth/`, `features/shops/`, etc.) contains:
- **Models**: SQLAlchemy database models
- **Schemas**: Pydantic input/output validation
- **Services**: Business logic and data processing
- **Routes**: FastAPI endpoint definitions
- **Dependencies**: Feature-specific dependency injection
- **Exceptions**: Custom exceptions for the feature

### B. Separation of Concerns

**Core Layer (`src/core/`)**
```python
# core/config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
```

**Shared Layer (`src/shared/`)**
```python
# shared/models/base.py
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime, String
from datetime import datetime
import uuid

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Feature Layer Example (`features/transactions/`)**
```python
# features/transactions/models.py
from shared.models.base import BaseModel
from shared.enums.transaction import TransactionType, TransactionStatus
from sqlalchemy import Column, String, Float, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship

class Transaction(BaseModel):
    __tablename__ = "transactions"
    
    shop_id = Column(String, ForeignKey("shops.id"), nullable=False)
    buyer_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Three-checkpoint completion
    buyer_paid_amount = Column(Float, default=0.0)
    farmer_paid_amount = Column(Float, default=0.0)
    commission_confirmed = Column(Boolean, default=False)
    
    # Financial details
    total_amount = Column(Float, nullable=False)
    commission_rate = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False)
    
    # Relationships
    shop = relationship("Shop", back_populates="transactions")
    buyer = relationship("User", back_populates="transactions")
    transaction_items = relationship("TransactionItem", back_populates="transaction")
    payments = relationship("Payment", back_populates="transaction")
```

```python
# features/transactions/services.py
from typing import List, Optional
from sqlalchemy.orm import Session
from .models import Transaction
from .schemas import TransactionCreate, TransactionUpdate
from shared.utils.validators import validate_commission_rate

class TransactionService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_transaction(self, transaction_data: TransactionCreate) -> Transaction:
        # Validate business rules
        validate_commission_rate(transaction_data.commission_rate)
        
        # Calculate commission
        commission_amount = transaction_data.total_amount * (transaction_data.commission_rate / 100)
        
        # Create transaction
        db_transaction = Transaction(
            **transaction_data.dict(),
            commission_amount=commission_amount
        )
        
        self.db.add(db_transaction)
        self.db.commit()
        self.db.refresh(db_transaction)
        
        return db_transaction
    
    def update_completion_status(self, transaction_id: str, update_data: TransactionUpdate) -> Transaction:
        transaction = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
        
        if not transaction:
            raise TransactionNotFoundException(f"Transaction {transaction_id} not found")
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(transaction, field, value)
        
        # Check completion status
        transaction.completion_status = self._calculate_completion_status(transaction)
        
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def _calculate_completion_status(self, transaction: Transaction) -> str:
        buyer_complete = transaction.buyer_paid_amount >= transaction.total_amount
        farmer_complete = transaction.farmer_paid_amount >= (transaction.total_amount - transaction.commission_amount)
        commission_complete = transaction.commission_confirmed
        
        if buyer_complete and farmer_complete and commission_complete:
            return "complete"
        elif any([buyer_complete, farmer_complete, commission_complete]):
            return "partial"
        else:
            return "pending"
```

```python
# features/transactions/routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from .services import TransactionService
from .schemas import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = TransactionService(db)
    return service.create_transaction(transaction_data)

@router.put("/{transaction_id}/completion", response_model=TransactionResponse)
def update_completion_status(
    transaction_id: str,
    update_data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = TransactionService(db)
    return service.update_completion_status(transaction_id, update_data)
```

### C. Dependency Injection Pattern

**Global Dependencies (`src/core/dependencies.py`)**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from core.database import SessionLocal
from core.config import settings

security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user
```

**Feature-Specific Dependencies (`features/transactions/dependencies.py`)**
```python
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from core.dependencies import get_db, get_current_user
from .models import Transaction

def get_transaction_by_id(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Transaction:
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check permissions
    if current_user.role != "SUPERADMIN" and transaction.shop_id != current_user.shop_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return transaction
```

## 3. Implementation Strategy

### A. Migration Plan

1. **Phase 1: Create New Structure**
   ```bash
   # Create new directory structure
   mkdir -p src/features/{auth,shops,products,transactions,payments,credits,subscriptions,analytics,audit,uploads,admin}
   mkdir -p src/shared/{models,schemas,enums,utils,constants}
   mkdir -p src/core
   mkdir -p src/api/v1/endpoints
   ```

2. **Phase 2: Move Existing Code**
   ```bash
   # Move models to feature-specific locations
   # Move services to feature modules
   # Update imports across the codebase
   ```

3. **Phase 3: Refactor Dependencies**
   ```bash
   # Update FastAPI router imports
   # Refactor dependency injection
   # Update test imports
   ```

### B. Best Practices Implementation

**Error Handling (`shared/exceptions.py`)**
```python
from fastapi import HTTPException

class BusinessLogicException(Exception):
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details
        super().__init__(self.message)

class TransactionNotFoundException(BusinessLogicException):
    pass

class InsufficientCreditsException(BusinessLogicException):
    pass

class SubscriptionLimitExceededException(BusinessLogicException):
    pass
```

**Logging (`core/logging.py`)**
```python
import logging
from logging.handlers import RotatingFileHandler
import os

def setup_logging():
    logging.basicConfig(level=logging.INFO)
    
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    # File handler
    file_handler = RotatingFileHandler(
        "logs/app.log", maxBytes=10485760, backupCount=5
    )
    file_handler.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
        )
    )
    
    # Add to root logger
    logging.getLogger().addHandler(file_handler)
```

**Testing Structure (`tests/`)**
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.main import app
from src.core.database import get_db, Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)
```