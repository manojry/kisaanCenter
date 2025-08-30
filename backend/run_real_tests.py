#!/usr/bin/env python3
"""
Real API Test Runner
Sets up database and runs comprehensive API tests
"""
import os
import sys
import subprocess

def main():
    """Run complete test suite with database setup"""
    print("🚀 Starting Real API Test Suite")
    print("=" * 50)
    
    # 1. Setup database
    print("📊 Setting up test database...")
    try:
        import setup_test_database
        setup_test_database.setup_database()
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return 1
    
    # 2. Run tests
    print("\n🧪 Running real API tests...")
    try:
        from tests.test_real_api_endpoints import run_real_api_tests
        passed, failed, skipped = run_real_api_tests()
        
        print("\n" + "=" * 50)
        print("📋 FINAL TEST SUMMARY")
        print("=" * 50)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⏭️  Skipped: {skipped}")
        
        total = passed + failed + skipped
        if total > 0:
            success_rate = (passed / total) * 100
            coverage_rate = ((passed + skipped) / total) * 100
            print(f"📊 Success Rate: {success_rate:.1f}%")
            print(f"🎯 API Coverage: {coverage_rate:.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
            return 0
        else:
            print(f"\n⚠️  {failed} test(s) failed - check API implementation")
            return 1
            
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)