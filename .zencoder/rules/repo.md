---
description: Repository Information Overview
alwaysApply: true
---

# KisaanCenter Repository Information

## Summary
KisaanCenter is an enterprise-grade Agricultural Market Management System with a FastAPI backend and React+TypeScript frontend. The system manages market operations including user roles, shop management, transactions, payments, and credit systems.

## Structure
- **backend/**: FastAPI application with SQLAlchemy ORM
- **frontend/**: React+TypeScript application with Vite
- **docs/**: Project documentation
- **.github/**: CI/CD workflows and GitHub Actions
- **logs/**: Application logs
- **uploads/**: File uploads storage
- **backups/**: Database backups

## Projects

### Backend (FastAPI)
**Configuration File**: `backend/requirements.txt`

#### Language & Runtime
**Language**: Python
**Version**: 3.8+
**Framework**: FastAPI 0.104.1
**Database**: PostgreSQL with SQLAlchemy 2.0.23

#### Dependencies
**Main Dependencies**:
- fastapi==0.104.1
- uvicorn[standard]==0.24.0
- sqlalchemy==2.0.23
- psycopg2-binary==2.9.9
- alembic==1.12.1/1.13.0
- pydantic==2.5.0
- python-jose[cryptography]==3.3.0
- passlib[bcrypt]==1.7.4

**Development Dependencies**:
- pytest==7.4.3
- pytest-asyncio==0.21.1
- httpx==0.25.2
- black==23.11.0
- isort==5.12.0
- flake8==6.1.0

#### Build & Installation
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows)
.venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Run server
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

#### Testing
**Framework**: pytest
**Test Location**: `backend/tests/`
**Configuration**: `backend/tests/conftest.py`
**Run Command**:
```bash
pytest backend/tests/
```

### Frontend (React)
**Configuration File**: `frontend/package.json`

#### Language & Runtime
**Language**: TypeScript
**Version**: 5.2.2
**Framework**: React 18.2.0
**Build System**: Vite 4.5.0
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- react==18.2.0
- react-dom==18.2.0
- react-router-dom==6.20.1
- react-query==3.39.3
- zustand==4.4.7
- axios==1.6.2
- react-hook-form==7.48.2
- zod==3.22.4
- tailwindcss==3.3.5

**Development Dependencies**:
- typescript==5.2.2
- @vitejs/plugin-react==4.1.1
- jest==29.7.0
- @testing-library/react==13.4.0
- eslint==8.53.0

#### Build & Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

#### Testing
**Framework**: Jest
**Test Location**: Throughout the codebase
**Run Command**:
```bash
npm test
```

## Environment Configuration
**Configuration File**: `.env`
**Template**: `.env.example`

**Required Variables**:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
- API_HOST, API_PORT

## Setup & Run
**Setup Script**: `setup_and_run.py`
**Usage**:
```bash
python setup_and_run.py [--port 8000] [--dev] [--reset-db]
```

## CI/CD
**Workflows**: GitHub Actions
- CI/CD Pipeline: `.github/workflows/ci-cd.yml`
- Test Suite: `.github/workflows/test.yml`
- Release Manager: `.github/workflows/release.yml`
- Health Check: `.github/workflows/health.yml`
- Docker Build: `.github/workflows/docker.yml`

## Features
- **User Management**: Multi-role system (superadmin, owner, farmer, buyer, employee)
- **Shop Operations**: Multi-tenant shop management
- **Transaction Processing**: Three-party completion model
- **Payment Systems**: Multiple payment methods with partial payment support
- **Credit Management**: Buyer credit system with detailed tracking
- **Commission Tracking**: Automated commission calculation
- **Feature Controls**: Granular restrictions on user creation and data access

# User Business Rules
1. Username must be unique across the system
2. Password must be hashed using SHA256 before storage
3. Superadmin users don't require shop_id
4. All other roles (owner, farmer, buyer, employee) must have shop_id
5. Credit limit can only be set for farmer and buyer roles
6. Only active users can perform transactions
7. User deletion is soft delete (status = INACTIVE)
8. Created_by tracks user creation hierarchy
9. Contact field should follow phone number format validation
10. Role changes require special permissions and validation

# Shop Business Rules
1. Shop name must be unique per owner
2. Owner must be a user with role 'owner'
3. Commission rate must be between 0-100%
4. Shop deletion requires all transactions to be completed
5. Only shop owner can modify shop settings
6. Shop status affects all related entities (users, products, transactions)
7. Plan_id determines feature access and limits
8. Address and contact are optional but recommended
9. Commission rate changes affect future transactions only
10. Shop creation automatically creates default product categories

# Transaction Business Rules
1. Transaction number is auto-generated and unique
2. Total amount = quantity * unit_price
3. Commission amount = total_amount * (commission_rate / 100)
4. Farmer amount = total_amount - commission_amount
5. Three-party completion model: ALL three checkboxes must be true for completion
6. Buyer and farmer must belong to the same shop
7. Product must be available in sufficient quantity
8. Commission rate defaults to shop's commission rate
9. Transaction date cannot be in the future
10. Status progression: PENDING → PROCESSING → COMPLETED/CANCELLED
11. Payment status tracks actual money flow
12. Completion status reflects three-party completion model

# Payment Business Rules
1. Payment amount cannot exceed transaction total amount
2. Multiple partial payments allowed until full amount is paid
3. Payment date cannot be in the future
4. Reference number should be unique per payment method
5. Payment method must be active to accept payments
6. Payment deletion requires special permissions
7. Payment modifications create audit trail
8. Advance payments can exceed transaction amount (for future transactions)
9. Payment status affects transaction payment status
10. Payment method determines validation rules for reference numbers

# Credit Business Rules
1. Outstanding amount = total_amount - paid_amount (auto-calculated)
2. Credit status automatically updates based on payment progress
3. Due date is optional but recommended for tracking
4. Credit can only be created for completed transactions
5. Buyer credit limit must not be exceeded
6. Credit details track farmer-specific portions
7. Partial payments update both credit and credit_details
8. Credit completion triggers transaction payment status update
9. Overdue credits generate alerts and reports
10. Credit deletion requires all payments to be reversed

# Database Relationships → Pydantic Schema Relationships

# One-to-Many: List type with forward reference
shops = relationship('Shop', back_populates='owner')
# Becomes:
owned_shops: List["ShopRead"] = []

# Many-to-One: Optional single object
shop = relationship('Shop', back_populates='users')
# Becomes:
shop: Optional["ShopRead"] = None

# Foreign Key fields must be included in base schemas
shop_id = Column(Integer, ForeignKey('shop.id'))
# Becomes:
shop_id: int

# Database computed properties → Pydantic computed fields

# In SQLAlchemy Model:
@hybrid_property
def full_name(self):
    return f"{self.first_name} {self.last_name}"

# In Pydantic Schema:
full_name: Optional[str] = Field(None, description="Computed full name")

# Populated in service layer, not in schema validation

// MANDATORY: Every Pydantic schema must have corresponding TypeScript interface

// Pydantic BaseModel → TypeScript interface
class UserRead(BaseModel):
    id: int
    username: str
    role: UserRole
    created_at: datetime

// Becomes:
interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at: string; // ISO string format
}


# Python Enum → TypeScript Enum (exact match required)

# Python:
class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    FARMER = "farmer"
    BUYER = "buyer"
    EMPLOYEE = "employee"

# TypeScript:
export enum UserRole {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  FARMER = 'farmer',
  BUYER = 'buyer',
  EMPLOYEE = 'employee'
}

// All API responses must follow APIResponse structure

interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

# Database constraints → Pydantic validation → Frontend validation

# Database:
username = Column(String(50), unique=True, nullable=False)

# Pydantic:
username: str = Field(..., min_length=3, max_length=50)

# Frontend (React Hook Form + Zod):
const userSchema = z.object({
  username: z.string().min(3).max(50)
});

# Business rules must be enforced at ALL layers

# Example: Credit Limit Validation
# 1. Database: Check constraint
# 2. API: Service layer validation
# 3. Frontend: Form validation + UI feedback

# Database:
credit_limit = Column(DECIMAL(12,2), CheckConstraint('credit_limit >= 0'))

# API Service:
def validate_credit_limit(user_role: str, credit_limit: Decimal):
    if user_role not in ['farmer', 'buyer'] and credit_limit > 0:
        raise ValueError("Credit limit only allowed for farmers and buyers")

# Frontend:
const validateCreditLimit = (role: string, limit: number) => {
  if (!['farmer', 'buyer'].includes(role) && limit > 0) {
    return "Credit limit only allowed for farmers and buyers";
  }
};

# 1. User Login → JWT Token Generation
# 2. Token Validation on Protected Routes
# 3. Role-Based Access Control (RBAC)
# 4. Shop-Level Data Isolation

# JWT Token Structure:
{
  "user_id": 123,
  "username": "farmer_john",
  "role": "farmer",
  "shop_id": 1,
  "exp": 1640995200
}

# Role-Based Permissions Matrix

PERMISSIONS = {
    "superadmin": ["*"],  # All permissions
    "owner": [
        "shop:read", "shop:update",
        "user:create", "user:read", "user:update", "user:delete",
        "product:*", "transaction:*", "payment:*", "credit:*"
    ],
    "employee": [
        "user:read", "product:read", "transaction:create", 
        "transaction:read", "payment:create", "payment:read"
    ],
    "farmer": [
        "stock:create", "stock:read", "stock:update",
        "transaction:read", "payment:read"
    ],
    "buyer": [
        "product:read", "transaction:create", "transaction:read",
        "payment:create", "payment:read", "credit:read"
    ]
}

graph TD
    A[Frontend: Create Transaction] --> B[API: Validate Request]
    B --> C[Service: Business Validation]
    C --> D[Database: Create Transaction]
    D --> E[Service: Update Stock]
    E --> F[Service: Calculate Commission]
    F --> G[Service: Create Credit if needed]
    G --> H[API: Return Response]
    H --> I[Frontend: Update UI]

    # Transaction Completion Logic
    def check_transaction_completion(transaction):
        if (transaction.buyer_payment_complete and 
            transaction.farmer_payment_complete and 
            transaction.commission_confirmed):
            transaction.completion_status = CompletionStatus.COMPLETE
            transaction.status = TransactionStatus.COMPLETED
        else:
            transaction.completion_status = CompletionStatus.INCOMPLETE



            # MANDATORY CHECKLIST:
□ Update SQLAlchemy models
□ Create Alembic migration
□ Update Pydantic schemas
□ Update TypeScript interfaces
□ Update API documentation
□ Update frontend types
□ Run full test suite
□ Update this BRAIN document

# MANDATORY CHECKLIST:
□ Update endpoint signatures
□ Update request/response schemas
□ Update OpenAPI documentation
□ Update frontend API calls
□ Update error handling
□ Test backward compatibility
□ Update integration tests

# MANDATORY CHECKLIST:
□ Verify API contract compatibility
□ Update TypeScript interfaces
□ Update form validations
□ Update state management
□ Test data flow end-to-end
□ Update component tests


# Step-by-step process:
1. Design database schema changes
2. Update this BRAIN document
3. Create/update SQLAlchemy models
4. Create Alembic migration
5. Update/create Pydantic schemas
6. Update/create API endpoints
7. Update/create services
8. Update/create TypeScript interfaces
9. Update/create frontend components
10. Write tests for all layers
11. Update documentation

# Identify the layer where bug exists:
1. Database layer: Check constraints, relationships
2. API layer: Check validation, business logic
3. Frontend layer: Check data handling, UI logic
4. Cross-layer: Check data synchronization

# Fix propagation:
- Database fix → Update models → Update schemas → Update frontend
- API fix → Update schemas → Update frontend
- Frontend fix → Verify API contract compliance

# Test Pyramid:
1. Unit Tests (70%):
   - Database models
   - Pydantic schemas
   - Service functions
   - Frontend components

2. Integration Tests (20%):
   - API endpoints
   - Database operations
   - Frontend API integration

3. E2E Tests (10%):
   - Complete user workflows
   - Cross-browser testing
   - Performance testing

   # System Health Indicators:
   - Database connection status
   - API response times
   - Frontend bundle size
   - Error rates by endpoint
   - User session metrics

   # Key Performance Indicators:
   - Transaction processing time
   - Database query performance
   - API endpoint response times
   - Frontend page load times
   - Memory usage patterns

   # Regular Validation Tasks:
   - Foreign key consistency
   - Calculated field accuracy
   - Business rule compliance
   - Data synchronization status
   - Backup integrity

   # Horizontal Scaling Preparation:
   - Database sharding strategy
   - API load balancing
   - Frontend CDN optimization
   - Caching layer implementation
   - Microservices migration path

   # Planned Enhancements:
   - Real-time notifications
   - Advanced analytics dashboard
   - Mobile application
   - Third-party integrations
   - Multi-language support

   # Database Models: backend/src/features/*/models/
   # API Schemas: backend/src/features/*/schemas/
   # API Endpoints: backend/src/api/
   # Services: backend/src/services/
   # Frontend Types: frontend/src/types/
   # Frontend Components: frontend/src/components/
   # Frontend Pages: frontend/src/pages/

   # Database Migration:
alembic revision --autogenerate -m "description"
alembic upgrade head

# API Documentation:
uvicorn src.main:app --reload
# Visit: http://localhost:8000/docs

# Frontend Development:
npm run dev
# Visit: http://localhost:3000

# Testing:
pytest backend/tests/
npm test

# Backend: backend/src/config.py
# Frontend: frontend/vite.config.ts
# Database: backend/alembic.ini
# Environment: .env


# Farmer Payment Business Rules
1. Payment amount cannot exceed farmer's share in transaction
2. Payment date cannot be in the future
3. Reference number should be unique per payment method
4. Farmer payment affects transaction farmer_payment_complete status
5. Only shop owner/employee can create farmer payments
6. Farmer payment deletion requires special permissions
7. Payment method must be from predefined list
8. Multiple payments allowed for single transaction
9. Total farmer payments cannot exceed farmer_amount
10. Farmer payment completion triggers transaction status update


# Complete relationship mapping across all entities

User:
  - One-to-Many: owned_shops (as owner)
  - Many-to-One: shop (as member)
  - One-to-Many: created_users (as creator)
  - Many-to-One: creator (created_by)
  - One-to-Many: transactions_as_buyer
  - One-to-Many: transactions_as_farmer
  - One-to-Many: payments
  - One-to-Many: credits_as_buyer
  - One-to-Many: farmer_payments
  - One-to-Many: farmer_stocks
  - One-to-Many: credit_details

Shop:
  - Many-to-One: owner (User)
  - Many-to-One: plan (Plan)
  - One-to-Many: users
  - One-to-Many: products
  - One-to-Many: transactions
  - One-to-Many: payments
  - One-to-Many: credits
  - One-to-Many: farmer_payments
  - One-to-Many: farmer_stocks

Product:
  - Many-to-One: category (ProductCategory)
  - Many-to-One: shop (Shop)
  - One-to-Many: transactions
  - One-to-Many: farmer_stocks
  - One-to-Many: price_history (ProductPrice)

Transaction:
  - Many-to-One: shop (Shop)
  - Many-to-One: buyer_user (User)
  - Many-to-One: farmer_user (User)
  - Many-to-One: product (Product)
  - One-to-Many: payments
  - One-to-Many: credits
  - One-to-Many: farmer_payments

Payment:
  - Many-to-One: transaction (Transaction)
  - Many-to-One: payment_method (PaymentMethod)

Credit:
  - Many-to-One: transaction (Transaction)
  - Many-to-One: buyer_user (User)
  - Many-to-One: shop (Shop)
  - One-to-Many: credit_details

FarmerPayment:
  - Many-to-One: transaction (Transaction)
  - Many-to-One: farmer_user (User)
  - Many-to-One: shop (Shop)

FarmerStock:
  - Many-to-One: farmer_user (User)
  - Many-to-One: product (Product)
  - Many-to-One: shop (Shop)

ProductCategory:
  - One-to-Many: products

Plan:
  - One-to-Many: shops

PaymentMethod:
  - One-to-Many: payments

ProductPrice:
  - Many-to-One: product (Product)
  - Many-to-One: creator (User)

CreditDetail:
  - Many-to-One: credit (Credit)
  - Many-to-One: farmer_user (User)