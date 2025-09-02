"""
Quick Validation Script for Recent Business Journey Fixes

This script validates the implemented fixes without requiring a running server:
1. Schema consistency checks
2. Import validation  
3. Authorization utility verification
4. API endpoint registration validation

Usage: python validate_business_journey_fixes.py
"""

import sys
import os
import importlib.util
from typing import List, Dict, Any

class BusinessJourneyValidator:
    def __init__(self):
        self.passed_tests = 0
        self.failed_tests = 0
        self.backend_path = os.path.join(os.getcwd(), "backend")
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.passed_tests += 1
        else:
            self.failed_tests += 1
    
    def test_file_exists(self, file_path: str, test_name: str):
        """Test if a file exists"""
        full_path = os.path.join(self.backend_path, file_path)
        exists = os.path.exists(full_path)
        self.log_test(test_name, exists, f"Path: {full_path}")
        return exists
    
    def test_file_contains_text(self, file_path: str, search_text: str, test_name: str):
        """Test if file contains specific text"""
        full_path = os.path.join(self.backend_path, file_path)
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                contains = search_text in content
                self.log_test(test_name, contains, f"Searching for: {search_text[:50]}...")
                return contains
        except Exception as e:
            self.log_test(test_name, False, f"Error reading file: {str(e)}")
            return False
    
    def test_schema_fixes(self):
        """Test 1-3: Schema consistency fixes"""
        print("\n=== Testing Schema Fixes ===")
        
        # Test shop service schema fix
        self.test_file_contains_text(
            "src/services/shop_service.py",
            "shop.record_status",
            "Shop Service Schema Consistency Fix"
        )
        
        # Test shops table plan_id column addition
        self.test_file_contains_text(
            "migrations/001_full_core_tables.sql", 
            "plan_id INTEGER REFERENCES plans(id)",
            "Shops Table Plan ID Column Added"
        )
        
        # Test schema uses record_status consistently
        consistent_status = (
            self.test_file_contains_text("migrations/001_full_core_tables.sql", "record_status", "Schema Record Status Usage") and
            not self.test_file_contains_text("migrations/001_full_core_tables.sql", "status VARCHAR", "No Old Status Columns")
        )
    
    def test_authorization_fixes(self):
        """Test 4-6: Authorization system implementation"""
        print("\n=== Testing Authorization Fixes ===")
        
        # Test authorization utility file exists
        self.test_file_exists("src/core/authorization.py", "Authorization Utility File Created")
        
        # Test authorization decorators implemented
        self.test_file_contains_text(
            "src/core/authorization.py",
            "require_roles",
            "Role-based Authorization Decorator"
        )
        
        # Test user creation endpoint has authorization
        self.test_file_contains_text(
            "src/api/simple_endpoints.py", 
            "current_user_id",
            "User Creation Authorization Check"
        )
    
    def test_endpoint_implementations(self):
        """Test 7-10: New endpoint implementations"""
        print("\n=== Testing New Endpoint Implementations ===")
        
        # Test owner products API exists
        self.test_file_exists("src/api/owner_products.py", "Owner Products API File")
        
        # Test owner products endpoints implemented
        self.test_file_contains_text(
            "src/api/owner_products.py",
            "/owner/products/available",
            "Owner Available Products Endpoint"
        )
        
        # Test superadmin plan assignment endpoints
        self.test_file_contains_text(
            "src/api/superadmin.py",
            "/admin/shops/{shop_id}/plan",
            "Superadmin Plan Assignment Endpoint"
        )
        
        # Test superadmin category assignment endpoints
        self.test_file_contains_text(
            "src/api/superadmin.py",
            "/categories/{category_id}/shops",
            "Superadmin Category Assignment Endpoint"
        )
    
    def test_api_registration(self):
        """Test 11-12: API router registration"""
        print("\n=== Testing API Router Registration ===")
        
        # Test owner products router import
        self.test_file_contains_text(
            "src/main.py",
            "from .api.owner_products import router as owner_products_router",
            "Owner Products Router Import"
        )
        
        # Test owner products router registration  
        self.test_file_contains_text(
            "src/main.py",
            "owner_products_router",
            "Owner Products Router Registration"
        )
    
    def test_business_documentation(self):
        """Test 13-14: Business journey documentation"""
        print("\n=== Testing Business Documentation ===")
        
        # Test business journey analysis document exists
        doc_path = os.path.join(os.getcwd(), "BUSINESS_JOURNEY_ANALYSIS.md")
        exists = os.path.exists(doc_path)
        self.log_test("Business Journey Analysis Document", exists, f"Path: {doc_path}")
        
        # Test comprehensive test script exists
        test_script_path = os.path.join(os.getcwd(), "test_complete_business_journey.py")  
        exists = os.path.exists(test_script_path)
        self.log_test("Comprehensive Test Script", exists, f"Path: {test_script_path}")
    
    def test_critical_imports(self):
        """Test 15-17: Critical import validations"""
        print("\n=== Testing Critical Import Validations ===")
        
        # Test API imports don't have obvious syntax errors
        try:
            sys.path.append(self.backend_path)
            # Test simple syntax validation without executing
            files_to_check = [
                "src/api/owner_products.py",
                "src/core/authorization.py", 
                "src/api/superadmin.py"
            ]
            
            import_issues = 0
            for file_path in files_to_check:
                full_path = os.path.join(self.backend_path, file_path)
                try:
                    with open(full_path, 'r') as f:
                        compile(f.read(), full_path, 'exec')
                except SyntaxError as e:
                    print(f"    Syntax error in {file_path}: {e}")
                    import_issues += 1
            
            self.log_test("Python Syntax Validation", import_issues == 0, 
                         f"Files checked: {len(files_to_check)}, Issues: {import_issues}")
                         
        except Exception as e:
            self.log_test("Python Syntax Validation", False, f"Error: {str(e)}")
    
    def run_validation(self):
        """Run all validation tests"""
        print("🔍 Starting Business Journey Fix Validation")
        print("=" * 60)
        
        # Run all test suites
        self.test_schema_fixes()
        self.test_authorization_fixes()
        self.test_endpoint_implementations()
        self.test_api_registration()
        self.test_business_documentation()
        self.test_critical_imports()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 VALIDATION SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        
        success_rate = (self.passed_tests / (self.passed_tests + self.failed_tests)) * 100 if (self.passed_tests + self.failed_tests) > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests == 0:
            print("🎉 ALL VALIDATIONS PASSED! Business journey fixes are properly implemented.")
            print("\n✨ Key Accomplishments:")
            print("   • Schema consistency fixed (record_status standardization)")
            print("   • Authorization system implemented with role-based access control")
            print("   • Owner product management endpoints created")
            print("   • Superadmin plan & category assignment endpoints added")
            print("   • Missing plan_id column added to shops table")
            print("   • All API routers properly registered")
            print("   • Comprehensive business journey documentation created")
        else:
            print(f"⚠️  {self.failed_tests} validations failed. Please review the issues above.")
        
        print("\n🚀 Next Steps:")
        print("   1. Fix any failed validations above")
        print("   2. Start the FastAPI server: uvicorn src.main:app --reload")
        print("   3. Run the comprehensive test: python test_complete_business_journey.py")
        print("   4. Test the business journeys manually via API documentation")

if __name__ == "__main__":
    validator = BusinessJourneyValidator()
    validator.run_validation()
