# KisaanCenter Frontend Development & API Integration Guide

---

## 1. System Overview

KisaanCenter is a multi-tenant agricultural market management platform supporting five roles: SUPERADMIN, OWNER, EMPLOYEE, FARMER, BUYER. The frontend is built with React + TypeScript, using a feature-based modular architecture, strict type safety, and role-based UI.

---

## 2. Folder Structure

```
src/
├── app/           # Routing, providers
├── features/      # Domain modules (auth, user, shop, product, transaction, payment, credit, etc.)
│   ├── user/
│   ├── shop/
│   ├── product/
│   ├── transaction/
│   ├── payment/
│   ├── credit/
│   └── ...
├── components/    # Shared UI (layout, forms, tables, etc.)
├── services/      # API clients, endpoint constants
├── context/       # Global state (auth, theme, permissions)
├── types/         # TypeScript models/interfaces
├── hooks/         # Custom hooks
├── utils/         # Utility functions
└── pages/         # Top-level route pages
```

---

## 3. API Integration Principles

- **Base URL:** `/api/v1`
- **Centralized API client** in `services/apiClient.ts`:
  - Automatic JWT token handling
  - Error handling and notifications
  - Request/response interceptors
  - TypeScript type safety
- **React Query** for data fetching/caching
- **Context API** for global state (auth, theme, permissions)

---

## 4. API Endpoints & Models

### Health & System
| Method | Endpoint                | Description                |
|--------|------------------------|----------------------------|
| GET    | /                      | Root health check          |
| GET    | /health                | Detailed system health     |
| GET    | /api/v1/info           | API information            |

### Authentication
| Method | Endpoint                | Description                |
|--------|------------------------|----------------------------|
| POST   | /users/auth/login      | User login                 |

### User Management
| Method | Endpoint                                 | Description                |
|--------|------------------------------------------|----------------------------|
| POST   | /users                                   | Create user                |
| GET    | /users/{user_id}                         | Get user by ID             |
| GET    | /users                                   | List users (paginated)     |
| PUT    | /users/{user_id}                         | Update user                |
| DELETE | /users/{user_id}                         | Soft delete user           |
| GET    | /users/shop/{shop_id}                    | Users by shop              |
| GET    | /users/farmers/with-stock/{shop_id}      | Farmers with stock         |
| GET    | /users/buyers/with-credit/{shop_id}      | Buyers with credit         |
| PUT    | /users/{user_id}/credit-limit            | Update credit limit        |
| GET    | /users/{user_id}/credits                 | Get user credits           |
| GET    | /users/{user_id}/transactions            | Get user transactions      |

#### User Model
```ts
interface User {
  id: string;
  username: string;
  role: 'SUPERADMIN' | 'OWNER' | 'EMPLOYEE' | 'FARMER' | 'BUYER' | 'GUEST';
  shop_id: string;
  contact: string;
  credit_limit: number;
  status: 'active' | 'inactive' | 'suspended';
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### Shop Management
| Method | Endpoint                | Description                |
|--------|------------------------|----------------------------|
| POST   | /shops                 | Create shop                |
| GET    | /shops/{shop_id}       | Get shop by ID             |
| GET    | /shops                 | List shops (paginated)     |
| PUT    | /shops/{shop_id}       | Update shop                |
| DELETE | /shops/{shop_id}       | Soft delete shop           |

#### Shop Model
```ts
interface Shop {
  id: string;
  name: string;
  owner_id: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### Product Management
| Method | Endpoint                | Description                |
|--------|------------------------|----------------------------|
| POST   | /products              | Create product             |
| GET    | /products/{product_id} | Get product                |
| GET    | /products              | List products              |
| PUT    | /products/{product_id} | Update product             |
| DELETE | /products/{product_id} | Delete product             |
| GET    | /categories            | List categories            |
| POST   | /categories            | Create category            |

#### Product Model
```ts
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  shop_id: string;
  created_at: string;
  updated_at: string;
}
```

### Stock Management
| Method | Endpoint                        | Description                |
|--------|----------------------------------|----------------------------|
| GET    | /farmer-stock/                   | List farmer stock          |
| POST   | /farmer-stock/                   | Add farmer stock           |
| PUT    | /farmer-stock/{id}               | Update farmer stock        |
| POST   | /stock-adjustments/              | Stock corrections          |
| GET    | /stock-status/{shop_id}          | Real-time stock status     |

#### Stock Model
```ts
interface Stock {
  id: string;
  farmer_id: string;
  shop_id: string;
  product_id: string;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### Transaction Management
| Method | Endpoint                                         | Description                |
|--------|--------------------------------------------------|----------------------------|
| POST   | /transactions                                    | Create transaction         |
| GET    | /transactions/{transaction_id}                   | Get transaction            |
| GET    | /transactions                                    | List transactions          |
| PUT    | /transactions/{transaction_id}                   | Update transaction         |
| DELETE | /transactions/{transaction_id}                   | Cancel transaction         |
| PUT    | /transactions/{transaction_id}/confirm-commission| Confirm commission         |
| GET    | /transactions/{transaction_id}/summary           | Financial summary          |
| GET    | /transactions/shop/{shop_id}/dashboard           | Shop dashboard             |
| GET    | /transactions/completion-status/pending          | Incomplete transactions    |

#### Transaction Model
```ts
interface Transaction {
  id: string;
  shop_id: string;
  buyer_user_id: string;
  transaction_type: string;
  commission_rate: number;
  transaction_items: TransactionItem[];
  status: string;
  created_at: string;
  updated_at: string;
}
interface TransactionItem {
  product_id: string;
  farmer_stock_id: string;
  quantity: number;
  price: number;
}
```

### Payment & Credit Management
| Method | Endpoint                | Description                |
|--------|------------------------|----------------------------|
| POST   | /payments              | Create payment             |
| GET    | /payments/{payment_id} | Get payment                |
| GET    | /payments              | List payments              |
| POST   | /credits               | Create credit              |
| GET    | /credits/{credit_id}   | Get credit                 |
| GET    | /credits               | List credits               |

#### Payment Model
```ts
interface Payment {
  id: string;
  transaction_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}
```

#### Credit Model
```ts
interface Credit {
  id: string;
  user_id: string;
  shop_id: string;
  amount: number;
  status: string;
  created_at: string;
}
```

### Specialized Endpoints
| Method | Endpoint                | Description                |
|--------|------------------------|----------------------------|
| GET    | /owner/dashboard       | Owner dashboard            |
| GET    | /owner/shops           | Managed shops              |
| GET    | /owner/users           | Shop users                 |
| GET    | /owner/transactions    | All transactions           |
| GET    | /owner/reports         | Financial reports          |
| POST   | /owner/settings        | Update settings            |
| GET    | /farmer/dashboard      | Farmer dashboard           |
| GET    | /farmer/stock          | My deliveries              |
| GET    | /farmer/sales          | My sales                   |
| GET    | /farmer/payments       | My payments                |
| GET    | /farmer/ledger         | Payment history            |
| POST   | /farmer/payment-request| Request payment            |
| GET    | /buyer/dashboard       | Buyer dashboard            |
| GET    | /buyer/products        | Available products         |
| POST   | /buyer/purchase        | Make purchase              |
| GET    | /buyer/transactions    | My purchases               |
| GET    | /buyer/credits         | Outstanding credits        |
| GET    | /buyer/ledger          | Payment history            |
| GET    | /employee/dashboard    | Employee dashboard         |
| POST   | /employee/transaction  | Process sale               |
| GET    | /employee/stock        | Check stock                |
| POST   | /employee/stock-adjust | Adjust stock               |
| GET    | /employee/tasks        | Assigned tasks             |

---

## 5. User Journey (Role-Based)

### SuperAdmin
- System overview, shop/user management, health monitoring, audit trails.

### Owner
- Shop dashboard, transaction management, commission rules, user management, analytics.

### Employee
- Daily dashboard, transaction processing, stock management, customer service.

### Farmer
- Stock dashboard, sales tracking, earnings, stock alerts.

### Buyer
- Purchase history, credit management, payment status, favorite products.

---

## 6. Development Standards & Best Practices

- **TypeScript strict mode** everywhere.
- **React Query** for data fetching/caching.
- **Context API** for global state (auth, theme, permissions).
- **TailwindCSS** for styling, CSS modules for isolation.
- **Responsive design**: Mobile-first, breakpoints for tablet/desktop.
- **Role-based access**: UI and API calls must check user role.
- **Reusable components**: Forms, tables, modals, etc.
- **Accessibility**: Keyboard and screen-reader support.
- **Testing**: Unit, integration, and E2E tests (Jest, Cypress).
- **Documentation**: Every feature and shared module must have a README.md.
- **API contracts**: Keep all frontend models and API contracts in sync with backend changes.

---

## 7. Onboarding & Environment

- Use `.env` for API base URL and secrets.
- Document environment setup for onboarding.
- Use Docker for local dev and deployment.
- CI/CD for automated build, test, deploy.

---

## 8. References

- See `docs/API_DOCUMENTATION.md` for full endpoint specs and request/response examples.
- See `COMPLETE_SYSTEM_DOCUMENTATION.md` for business rules and ERD.
- See feature-level README.md files for implementation details.
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

This document is the single source of truth for frontend development and API integration. All features, endpoints, models, and business logic must be implemented as described and kept in sync with backend changes.
