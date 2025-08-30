#!/usr/bin/env python3
"""
Complete Setup and Test Runner
1. Setup PostgreSQL database schema
2. Run API tests
"""
import os
import sys

def main():
    """Run complete setup and testing"""
    print("🚀 Starting Complete Setup and Testing")
    print("=" * 50)
    
    # 1. Setup PostgreSQL database
    print("📊 Setting up PostgreSQL database schema...")
    try:
        import setup_postgres_schema
        setup_postgres_schema.setup_database()
        print("✅ PostgreSQL database setup complete")
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return 1
    
    # 2. Run API tests
    print("\n🧪 Running API tests...")
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
            print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
            print("✅ Database schema created")
            print("✅ API endpoints working")
            print("✅ Real database integration verified")
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