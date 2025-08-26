#!/usr/bin/env python3
"""
Simple startup script for the KisaanCenter Market Management System API
"""
import os
import sys

# Add the backend src directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_src = os.path.join(current_dir, 'backend', 'src')
sys.path.insert(0, backend_src)

try:
    import uvicorn
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    
    # Create a simple FastAPI app with endpoint documentation
    app = FastAPI(
        title="KisaanCenter Market Management System API",
        description="""
        # 🌾 Market Management System API
        
        An enterprise-level agricultural market management system providing comprehensive APIs for:
        
        ## 📋 Core Features
        - **User Management**: Multi-role user system (superadmin, owner, farmer, buyer, employee)
        - **Shop Operations**: Multi-tenant shop management
        - **Product Management**: Product catalog with categories
        - **Stock Management**: Real-time farmer stock tracking
        - **Transaction Processing**: Complete transaction lifecycle with three-party completion model
        - **Payment Systems**: Multiple payment methods with partial payment support
        - **Credit Management**: Buyer credit system with detailed tracking
        - **Commission Tracking**: Automated commission calculation and confirmation
        
        ## 🔗 API Endpoints Overview
        
        ### User Management (`/api/v1/users`)
        - `POST /api/v1/users/` - Create new user
        - `GET /api/v1/users/{user_id}` - Get user by ID
        - `GET /api/v1/users/` - List users with pagination
        - `PUT /api/v1/users/{user_id}` - Update user
        - `DELETE /api/v1/users/{user_id}` - Delete user
        - `GET /api/v1/users/{user_id}/credits` - Get user credits
        - `GET /api/v1/users/{user_id}/transactions` - Get user transactions
        
        ### Shop Management (`/api/v1/shops`)
        - `POST /api/v1/shops/` - Create new shop
        - `GET /api/v1/shops/{shop_id}` - Get shop by ID
        - `GET /api/v1/shops/` - List shops with pagination
        - `PUT /api/v1/shops/{shop_id}` - Update shop
        - `DELETE /api/v1/shops/{shop_id}` - Delete shop
        
        ### Product Management (`/api/v1/products`)
        - `POST /api/v1/products/` - Create new product
        - `GET /api/v1/products/{product_id}` - Get product by ID
        - `GET /api/v1/products/` - List products with pagination
        - `PUT /api/v1/products/{product_id}` - Update product
        - `DELETE /api/v1/products/{product_id}` - Delete product
        
        ### Transaction Management (`/api/v1/transactions`)
        - `POST /api/v1/transactions/` - Create new transaction
        - `GET /api/v1/transactions/{transaction_id}` - Get transaction by ID
        - `GET /api/v1/transactions/` - List transactions with pagination
        - `PUT /api/v1/transactions/{transaction_id}` - Update transaction
        - `DELETE /api/v1/transactions/{transaction_id}` - Delete transaction
        - `POST /api/v1/transactions/{transaction_id}/confirm-commission` - Confirm commission
        - `GET /api/v1/transactions/{transaction_id}/completion-status` - Get completion status
        
        ### Payment Management (`/api/v1/payments`)
        - `POST /api/v1/payments/` - Create new payment
        - `GET /api/v1/payments/{payment_id}` - Get payment by ID
        - `GET /api/v1/payments/` - List payments with pagination
        - `PUT /api/v1/payments/{payment_id}` - Update payment
        - `DELETE /api/v1/payments/{payment_id}` - Delete payment
        
        ### Credit Management (`/api/v1/credits`)
        - `POST /api/v1/credits/` - Create new credit
        - `GET /api/v1/credits/{credit_id}` - Get credit by ID
        - `GET /api/v1/credits/` - List credits with pagination
        - `PUT /api/v1/credits/{credit_id}` - Update credit
        - `DELETE /api/v1/credits/{credit_id}` - Delete credit
        - `POST /api/v1/credits/{credit_id}/partial-payment` - Make partial payment
        
        ## 🏥 Health & System Endpoints
        - `GET /` - Root endpoint (API health check)
        - `GET /health` - Detailed health check
        - `GET /api/v1/info` - API information and capabilities
        
        ## 📚 Documentation
        - `GET /docs` - Interactive Swagger UI documentation
        - `GET /redoc` - ReDoc documentation
        - `GET /openapi.json` - OpenAPI specification
        
        ## 🔧 Database Connection Status
        **Note**: Currently running in demo mode due to database connectivity issues.
        Connect to your RDS database by ensuring network accessibility and proper configuration.
        """,
        version="1.0.0"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/", tags=["Health"])
    def read_root():
        """Root endpoint - API health check"""
        return {
            "message": "🚀 KisaanCenter Market Management System API is running",
            "version": "1.0.0",
            "status": "healthy",
            "mode": "demo",
            "docs": "/docs",
            "redoc": "/redoc",
            "note": "Database connection may need configuration for full functionality"
        }
    
    @app.get("/health", tags=["Health"])
    def health_check():
        """Detailed health check endpoint"""
        return {
            "status": "healthy",
            "version": "1.0.0",
            "mode": "demo",
            "services": {
                "api": "operational",
                "database": "needs_configuration",
                "cache": "not_configured"
            },
            "endpoints": {
                "users": "/api/v1/users",
                "shops": "/api/v1/shops",
                "products": "/api/v1/products", 
                "transactions": "/api/v1/transactions",
                "payments": "/api/v1/payments",
                "credits": "/api/v1/credits"
            }
        }
    
    @app.get("/api/v1/info", tags=["System"])
    def api_info():
        """API information and capabilities"""
        return {
            "name": "KisaanCenter Market Management System API",
            "version": "1.0.0",
            "description": "Enterprise-level agricultural market management system",
            "architecture": "Three-party transaction completion model",
            "features": [
                "Multi-tenant shop management",
                "Three-party transaction completion model", 
                "Real-time stock management",
                "Flexible payment systems",
                "Credit management",
                "Commission tracking",
                "Comprehensive audit trail"
            ],
            "endpoints": {
                "users": {
                    "base": "/api/v1/users",
                    "operations": ["CREATE", "READ", "UPDATE", "DELETE", "LIST"],
                    "features": ["pagination", "filtering", "role_management"]
                },
                "shops": {
                    "base": "/api/v1/shops",
                    "operations": ["CREATE", "READ", "UPDATE", "DELETE", "LIST"],
                    "features": ["pagination", "filtering", "multi_tenant"]
                },
                "products": {
                    "base": "/api/v1/products", 
                    "operations": ["CREATE", "READ", "UPDATE", "DELETE", "LIST"],
                    "features": ["pagination", "filtering", "categories"]
                },
                "transactions": {
                    "base": "/api/v1/transactions",
                    "operations": ["CREATE", "READ", "UPDATE", "DELETE", "LIST"],
                    "features": ["pagination", "filtering", "completion_tracking", "commission_confirmation"]
                },
                "payments": {
                    "base": "/api/v1/payments",
                    "operations": ["CREATE", "READ", "UPDATE", "DELETE", "LIST"],
                    "features": ["pagination", "filtering", "partial_payments", "multiple_methods"]
                },
                "credits": {
                    "base": "/api/v1/credits",
                    "operations": ["CREATE", "READ", "UPDATE", "DELETE", "LIST"],
                    "features": ["pagination", "filtering", "partial_repayment", "detailed_tracking"]
                }
            },
            "documentation": {
                "swagger": "/docs",
                "redoc": "/redoc",
                "openapi": "/openapi.json"
            }
        }
    
    if __name__ == "__main__":
        print("🚀 Starting KisaanCenter Market Management System API...")
        print("📋 This is a demo version showing API structure")
        print("🔗 Access the API documentation at: http://localhost:8000/docs")
        print("🏥 Health check available at: http://localhost:8000/health")
        print("ℹ️  API info available at: http://localhost:8000/api/v1/info")
        print("⚠️  Note: Database endpoints require RDS connectivity configuration")
        
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("📋 API Endpoint Structure (without running server):")
    print("\n🔗 Available Endpoints:")
    print("=" * 60)
    
    endpoints = {
        "Health & System": [
            "GET /",
            "GET /health", 
            "GET /api/v1/info"
        ],
        "Users (/api/v1/users)": [
            "POST /api/v1/users/",
            "GET /api/v1/users/{user_id}",
            "GET /api/v1/users/",
            "PUT /api/v1/users/{user_id}",
            "DELETE /api/v1/users/{user_id}",
            "GET /api/v1/users/{user_id}/credits",
            "GET /api/v1/users/{user_id}/transactions"
        ],
        "Shops (/api/v1/shops)": [
            "POST /api/v1/shops/",
            "GET /api/v1/shops/{shop_id}",
            "GET /api/v1/shops/",
            "PUT /api/v1/shops/{shop_id}",
            "DELETE /api/v1/shops/{shop_id}"
        ],
        "Products (/api/v1/products)": [
            "POST /api/v1/products/",
            "GET /api/v1/products/{product_id}",
            "GET /api/v1/products/",
            "PUT /api/v1/products/{product_id}",
            "DELETE /api/v1/products/{product_id}"
        ],
        "Transactions (/api/v1/transactions)": [
            "POST /api/v1/transactions/",
            "GET /api/v1/transactions/{transaction_id}",
            "GET /api/v1/transactions/",
            "PUT /api/v1/transactions/{transaction_id}",
            "DELETE /api/v1/transactions/{transaction_id}",
            "POST /api/v1/transactions/{transaction_id}/confirm-commission",
            "GET /api/v1/transactions/{transaction_id}/completion-status"
        ],
        "Payments (/api/v1/payments)": [
            "POST /api/v1/payments/",
            "GET /api/v1/payments/{payment_id}",
            "GET /api/v1/payments/",
            "PUT /api/v1/payments/{payment_id}",
            "DELETE /api/v1/payments/{payment_id}"
        ],
        "Credits (/api/v1/credits)": [
            "POST /api/v1/credits/",
            "GET /api/v1/credits/{credit_id}",
            "GET /api/v1/credits/",
            "PUT /api/v1/credits/{credit_id}",
            "DELETE /api/v1/credits/{credit_id}",
            "POST /api/v1/credits/{credit_id}/partial-payment"
        ]
    }
    
    for category, endpoint_list in endpoints.items():
        print(f"\n📁 {category}:")
        for endpoint in endpoint_list:
            print(f"   {endpoint}")
    
    print("\n" + "=" * 60)
    print("🌐 Base URL: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    print("📖 ReDoc: http://localhost:8000/redoc")
    print("⚠️  Note: RDS database connection needs to be configured for full functionality")
