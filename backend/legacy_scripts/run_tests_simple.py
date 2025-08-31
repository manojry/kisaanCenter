#!/usr/bin/env python3
"""
Simple Test Runner - Fixed Version
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

# Setup database first
print("📊 Setting up test database...")
import setup_test_database
setup_test_database.setup_database()

# Run tests
print("\n🧪 Running real API tests...")
from tests.test_real_api_endpoints import run_real_api_tests
passed, failed, skipped = run_real_api_tests()

print(f"\n📋 FINAL RESULTS: {passed} passed, {failed} failed, {skipped} skipped")
if failed == 0:
    print("🎉 SUCCESS!")
else:
    print(f"⚠️ {failed} failures - check API implementation")