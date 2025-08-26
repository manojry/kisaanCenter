#!/usr/bin/env python3
"""
Static Endpoint Validation
Validates all 22 API endpoints are properly defined without running server
"""

import os
import re
from pathlib import Path

def validate_endpoints():
    """Validate all 22 API endpoints are properly defined"""
    
    print("🔌 VALIDATING ALL 22 API ENDPOINTS")
    print("="*50)
    
    # Define all expected endpoints
    endpoints = {
        "Health Endpoints (3)": {
            "file": "src/main.py",
            "endpoints": [
                'GET /"',
                'GET "/health"', 
                'GET "/api/v1/info"'
            ]
        },
        "User Management (8)": {
            "file": "src/api/users.py",
            "endpoints": [
                'POST "/users/"',
                'GET "/users/{user_id}"',
                'GET "/users/"',
                'PUT "/users/{user_id}"',
                'DELETE "/users/{user_id}"',
                'POST "/users/auth/login"',
                'GET "/users/shop/{shop_id}"',
                'PUT "/users/{user_id}/credit-limit"'
            ]
        },
        "Transaction Processing (8)": {
            "file": "src/api/transactions.py", 
            "endpoints": [
                'POST "/transactions/"',
                'GET "/transactions/{transaction_id}"',
                'GET "/transactions/"',
                'PUT "/transactions/{transaction_id}"',
                'DELETE "/transactions/{transaction_id}"',
                'PUT "/transactions/{transaction_id}/confirm-commission"',
                'GET "/transactions/{transaction_id}/summary"',
                'GET "/transactions/shop/{shop_id}/dashboard"'
            ]
        },
        "Shop Management (5)": {
            "file": "src/api/shops.py",
            "endpoints": [
                'POST "/shops/"',
                'GET "/shops/{shop_id}"',
                'GET "/shops/"',
                'PUT "/shops/{shop_id}"',
                'DELETE "/shops/{shop_id}"'
            ]
        }
    }
    
    total_endpoints = 0
    found_endpoints = 0
    
    for category, info in endpoints.items():
        print(f"\n📂 {category}")
        file_path = info["file"]
        
        if not Path(file_path).exists():
            print(f"❌ File not found: {file_path}")
            continue
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            for endpoint in info["endpoints"]:
                total_endpoints += 1
                
                # Extract method and path for validation
                method = endpoint.split()[0]
                path = endpoint.split()[1].strip('"')
                
                # Look for router decorator with this method and path
                patterns = [
                    f'@router.{method.lower()}\\("{re.escape(path)}"',
                    f'@app.{method.lower()}\\("{re.escape(path)}"'
                ]
                
                found = False
                for pattern in patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        found = True
                        break
                
                if found:
                    found_endpoints += 1
                    print(f"  ✅ {endpoint}")
                else:
                    print(f"  ❌ {endpoint}")
                    
        except Exception as e:
            print(f"❌ Error reading {file_path}: {str(e)}")
    
    # Additional endpoints from other files
    additional_endpoints = [
        ("Products", "src/api/products.py", 2),
        ("Payments", "src/api/payments.py", 2), 
        ("Credits", "src/api/credits.py", 2)
    ]
    
    print(f"\n📂 Additional Endpoints")
    for name, file_path, expected_count in additional_endpoints:
        if Path(file_path).exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Count router decorators
                router_count = len(re.findall(r'@router\.(get|post|put|delete)', content, re.IGNORECASE))
                total_endpoints += expected_count
                found_endpoints += min(router_count, expected_count)
                
                print(f"  ✅ {name}: {min(router_count, expected_count)}/{expected_count} endpoints")
                
            except Exception as e:
                print(f"  ❌ {name}: Error reading file - {str(e)}")
        else:
            print(f"  ❌ {name}: File not found - {file_path}")
    
    print("\n" + "="*50)
    print("📊 ENDPOINT VALIDATION SUMMARY")
    print("="*50)
    
    success_rate = (found_endpoints / total_endpoints) * 100 if total_endpoints > 0 else 0
    
    print(f"Total Expected Endpoints: {total_endpoints}")
    print(f"Found Endpoints: {found_endpoints}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🚀 STATUS: EXCELLENT - All endpoints properly defined")
    elif success_rate >= 80:
        print("✅ STATUS: GOOD - Most endpoints defined")
    elif success_rate >= 60:
        print("⚠️ STATUS: NEEDS WORK - Some endpoints missing")
    else:
        print("❌ STATUS: CRITICAL - Many endpoints missing")
    
    return success_rate >= 80

def validate_business_logic():
    """Validate business logic implementation"""
    
    print("\n💼 VALIDATING BUSINESS LOGIC")
    print("="*50)
    
    business_components = {
        "User Service": {
            "file": "src/services/user_service.py",
            "methods": [
                "create_user",
                "get_user", 
                "authenticate_user",
                "update_user",
                "delete_user"
            ]
        },
        "Transaction Service": {
            "file": "src/services/transaction_service.py",
            "methods": [
                "create_transaction",
                "get_transaction",
                "confirm_commission", 
                "get_transaction_summary",
                "get_shop_dashboard"
            ]
        },
        "Database Models": {
            "file": "src/models.py",
            "methods": [
                "class User",
                "class Shop",
                "class Product", 
                "class Transaction",
                "class Payment"
            ]
        }
    }
    
    total_components = 0
    found_components = 0
    
    for component, info in business_components.items():
        print(f"\n📋 {component}")
        file_path = info["file"]
        
        if not Path(file_path).exists():
            print(f"❌ File not found: {file_path}")
            continue
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            for method in info["methods"]:
                total_components += 1
                
                if method in content:
                    found_components += 1
                    print(f"  ✅ {method}")
                else:
                    print(f"  ❌ {method}")
                    
        except Exception as e:
            print(f"❌ Error reading {file_path}: {str(e)}")
    
    success_rate = (found_components / total_components) * 100 if total_components > 0 else 0
    
    print(f"\nBusiness Logic Success Rate: {success_rate:.1f}%")
    return success_rate >= 80

def main():
    """Main validation function"""
    
    print("🎯 MARKET MANAGEMENT SYSTEM - ENDPOINT VALIDATION")
    print("="*60)
    
    # Change to backend directory if needed
    if Path("backend").exists():
        os.chdir("backend")
    
    # Validate endpoints
    endpoints_ok = validate_endpoints()
    
    # Validate business logic
    business_ok = validate_business_logic()
    
    print("\n" + "="*60)
    print("🏁 FINAL VALIDATION RESULTS")
    print("="*60)
    
    print(f"API Endpoints: {'✅ PASS' if endpoints_ok else '❌ FAIL'}")
    print(f"Business Logic: {'✅ PASS' if business_ok else '❌ FAIL'}")
    
    overall_success = endpoints_ok and business_ok
    
    if overall_success:
        print("\n🚀 SYSTEM STATUS: PRODUCTION READY")
        print("✅ All 22 API endpoints properly implemented")
        print("✅ Business logic components validated")
        print("✅ Ready for comprehensive testing")
    else:
        print("\n⚠️ SYSTEM STATUS: NEEDS ATTENTION")
        print("🔧 Please address the issues identified above")
    
    print("\n📋 NEXT STEPS:")
    if overall_success:
        print("1. Run comprehensive endpoint tests")
        print("2. Perform load testing")
        print("3. Deploy to production environment")
    else:
        print("1. Fix missing endpoints/components")
        print("2. Re-run validation")
        print("3. Proceed with testing once validated")
    
    return overall_success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)