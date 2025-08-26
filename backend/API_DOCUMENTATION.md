# Market Management System API Documentation

## Overview

The Market Management System API is a comprehensive, production-ready backend system for managing agricultural market operations. It implements a three-party transaction completion model with enterprise-grade features.

## Architecture

```
API Layer (FastAPI) → Service Layer → CRUD Layer → Database (PostgreSQL/SQLite)
```

### Key Features

- **Multi-tenant Architecture**: Complete data isolation per shop
- **Three-Party Transaction Model**: Independent tracking of buyer payments, farmer payments, and commission confirmation
- **Real-time Stock Management**: Automatic stock updates with transaction processing
- **Flexible Payment System**: Support for full, partial, advance, and credit transactions
- **Comprehensive Audit Trail**: Complete change tracking for compliance
- **Role-based Access Control**: Superadmin, Owner, Employee, Farmer, Buyer roles
- **Business Rule Validation**: Comprehensive validation at all layers

## API Endpoints

### Authentication & Users

#### POST /api/v1/users/
Create a new user with role-based validation.

**Request Body:**
```json
{
  "username": "farmer1",
  "password": "securepassword",
  "role": "farmer",
  "shop_id": 1,
  "contact": "+91-9876543210",
  "credit_limit": 10000.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user_id": 123,
    "username": "farmer1"
  }
}
```

#### POST /api/v1/users/auth/login
Authenticate user credentials.

**Query Parameters:**
- `username`: User's username
- `password`: User's password

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user_id": 123,
    "username": "farmer1",
    "role": "farmer",
    "shop_id": 1
  }
}
```

#### GET /api/v1/users/{user_id}
Get user details by ID.

**Query Parameters:**
- `include_relations`: Include shop, transactions, credits data (default: false)

#### GET /api/v1/users/
Get paginated users with filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (1-100, default: 10)
- `shop_id`: Filter by shop
- `role`: Filter by user role
- `status`: Filter by user status
- `search`: Search in username and contact
- `sort_by`: Sort field (default: created_at)
- `sort_order`: asc/desc (default: desc)

### Transactions

#### POST /api/v1/transactions/
Create a comprehensive transaction with items.

**Request Body:**
```json
{
  "shop_id": 1,
  "buyer_user_id": 456,
  "transaction_type": "sale",
  "commission_rate": 10.00,
  "transaction_items": [
    {
      "product_id": 789,
      "farmer_stock_id": 101,
      "quantity": 50.0,
      "price": 100.00
    }
  ]
}
```

**Business Logic:**
- Validates stock availability
- Calculates commission automatically
- Updates farmer stock quantities
- Initializes three-party completion tracking

#### GET /api/v1/transactions/{transaction_id}
Get detailed transaction information.

**Query Parameters:**
- `include_relations`: Include buyer, items, payments, credits (default: false)

#### GET /api/v1/transactions/
Get paginated transactions with advanced filtering.

**Query Parameters:**
- `shop_id`: Filter by shop
- `buyer_id`: Filter by buyer
- `status`: Filter by transaction status
- `completion_status`: Filter by completion status (pending/partial/complete)
- `payment_status`: Filter by payment status
- `transaction_type`: Filter by type (sale/return/adjustment)
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)

#### PUT /api/v1/transactions/{transaction_id}/confirm-commission
Confirm transaction commission (Owner only).

**Query Parameters:**
- `confirmed_by_id`: ID of user confirming commission

#### GET /api/v1/transactions/{transaction_id}/summary
Get comprehensive financial breakdown.

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction_id": 123,
    "total_amount": 5000.00,
    "commission_amount": 500.00,
    "net_farmer_amount": 4500.00,
    "buyer_paid_amount": 3000.00,
    "farmer_paid_amount": 2000.00,
    "outstanding_buyer_amount": 2000.00,
    "outstanding_farmer_amount": 2500.00,
    "completion_percentage": 45.67,
    "commission_confirmed": false,
    "status": "active",
    "completion_status": "partial"
  }
}
```

### Dashboard & Analytics

#### GET /api/v1/transactions/shop/{shop_id}/dashboard
Get comprehensive shop dashboard.

**Query Parameters:**
- `date_from`: Dashboard start date (YYYY-MM-DD)
- `date_to`: Dashboard end date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_transactions": 150,
    "pending_transactions": 25,
    "completed_transactions": 100,
    "total_sales": 250000.00,
    "total_commission": 25000.00,
    "outstanding_credits": 15000.00,
    "active_farmers": 45,
    "active_buyers": 30,
    "completion_rate": 66.67
  }
}
```

#### GET /api/v1/transactions/completion-status/pending
Get transactions requiring completion actions.

**Query Parameters:**
- `shop_id`: Filter by shop
- `action_required`: buyer_payment|farmer_payment|commission
- `page`: Page number
- `limit`: Items per page

## Business Rules

### User Management
1. **Role Hierarchy**: Superadmin > Owner > Employee > Farmer/Buyer
2. **Shop Isolation**: Users can only access data from their assigned shop (except superadmin)
3. **Credit Limits**: Only buyers and farmers can have credit limits
4. **Username Uniqueness**: Usernames must be unique across the system

### Transaction Processing
1. **Three-Party Completion**: Transactions require buyer payment, farmer payment, and commission confirmation
2. **Stock Validation**: Sufficient stock must be available before transaction creation
3. **Automatic Calculations**: Commission amounts calculated based on configurable rates
4. **Status Progression**: PENDING → PARTIAL → COMPLETE based on payment completion

### Payment System
1. **Partial Payments**: Support for multiple partial payments toward transactions
2. **Credit Management**: Automatic credit creation for unpaid amounts
3. **Payment Methods**: Multiple payment methods supported (cash, bank transfer, UPI, etc.)
4. **Outstanding Tracking**: Real-time tracking of outstanding amounts

### Data Integrity
1. **Soft Deletes**: Records are marked inactive rather than permanently deleted
2. **Audit Trail**: All changes tracked with user ID and timestamp
3. **Referential Integrity**: Foreign key constraints maintained
4. **Transaction Atomicity**: Database transactions ensure data consistency

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error_code": "ERROR_CODE",
  "path": "/api/v1/endpoint",
  "timestamp": 1640995200.0
}
```

### Common Error Codes
- `HTTP_400`: Bad Request - Invalid input data
- `HTTP_401`: Unauthorized - Authentication required
- `HTTP_403`: Forbidden - Insufficient permissions
- `HTTP_404`: Not Found - Resource not found
- `HTTP_409`: Conflict - Data conflict (e.g., duplicate username)
- `HTTP_500`: Internal Server Error - System error

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling for concurrent requests
- Query optimization with selective field loading
- Pagination for large result sets

### Caching Strategy
- Application-level caching for reference data
- Database query result caching
- Session-based user data caching

### Monitoring
- Request/response time tracking
- Database connection monitoring
- Error rate monitoring
- Business metrics tracking

## Security Features

### Authentication
- Password hashing with SHA-256
- Session-based authentication
- Role-based access control

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

### Audit & Compliance
- Complete audit trail for all changes
- User action logging
- Data retention policies
- Regulatory compliance support

## Deployment

### Environment Configuration
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kisaan_center
DB_USER=kisaan_user
DB_PASSWORD=secure_password

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### Health Checks
- `GET /health`: Detailed system health
- `GET /`: Basic API status
- Database connectivity monitoring
- Service dependency checks

## Testing

### Test Coverage
- Unit tests for all service methods
- Integration tests for API endpoints
- Business rule validation tests
- Database transaction tests

### Test Data
- Comprehensive test fixtures
- Multi-scenario test cases
- Edge case validation
- Performance testing

## API Versioning

Current version: `v1`
- Backward compatibility maintained
- Deprecation notices for breaking changes
- Migration guides for version updates

## Rate Limiting

- 1000 requests per minute per IP
- 10000 requests per hour per authenticated user
- Burst allowance for legitimate traffic spikes

## Support

For technical support and API questions:
- Email: support@kisaancenter.com
- Documentation: `/docs` (Swagger UI)
- API Schema: `/openapi.json`