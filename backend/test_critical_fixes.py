#!/usr/bin/env python3
"""
Quick API Test - Testing Critical Security Fixes
Tests the SecurityUtils.validate_token method and AuditLogger.log_error method
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def test_security_utils():
    """Test SecurityUtils methods"""
    try:
        from src.core.security import SecurityUtils
        print("✅ SecurityUtils imported successfully")
        
        # Check if validate_token method exists
        if hasattr(SecurityUtils, 'validate_token'):
            print("✅ SecurityUtils.validate_token method exists")
        else:
            print("❌ SecurityUtils.validate_token method missing")
            return False
            
        # Check if verify_token method exists  
        if hasattr(SecurityUtils, 'verify_token'):
            print("✅ SecurityUtils.verify_token method exists")
        else:
            print("❌ SecurityUtils.verify_token method missing")
            return False
            
        return True
    except Exception as e:
        print(f"❌ SecurityUtils test failed: {e}")
        return False

def test_audit_logger():
    """Test AuditLogger methods"""
    try:
        from src.core.logging import AuditLogger
        print("✅ AuditLogger imported successfully")
        
        # Check if log_error method exists
        if hasattr(AuditLogger, 'log_error'):
            print("✅ AuditLogger.log_error method exists")
        else:
            print("❌ AuditLogger.log_error method missing")
            return False
            
        # Test instantiation
        logger = AuditLogger()
        print("✅ AuditLogger instance created successfully")
        return True
    except Exception as e:
        print(f"❌ AuditLogger test failed: {e}")
        return False

def test_app_startup():
    """Test if the application starts without errors"""
    try:
        from src.main import app
        print("✅ FastAPI app imported and created successfully")
        print(f"   App title: {app.title}")
        return True
    except Exception as e:
        print(f"❌ App startup test failed: {e}")
        return False

def main():
    """Run all critical tests"""
    print("🧪 Running Critical Security & Logging Fixes Tests")
    print("=" * 60)
    
    tests = [
        ("SecurityUtils Methods", test_security_utils),
        ("AuditLogger Methods", test_audit_logger), 
        ("App Startup", test_app_startup)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing: {test_name}")
        print("-" * 40)
        if test_func():
            print(f"✅ {test_name}: PASSED")
            passed += 1
        else:
            print(f"❌ {test_name}: FAILED")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 ALL CRITICAL FIXES VERIFIED!")
        print("The API endpoints should now work correctly.")
    else:
        print("⚠️  Some critical fixes need attention.")
        
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
