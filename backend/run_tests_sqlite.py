"""
Run tests with SQLite database for faster execution
"""
import os
import sys

# Set environment for testing before any imports
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///test.db"

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def run_tests():
    import pytest
    
    # Run specific test
    result = pytest.main([
        "tests/test_all_endpoints.py::test_get_users",
        "-v",
        "-s",
        "--tb=short"
    ])
    
    return result

if __name__ == "__main__":
    print("Running tests with SQLite...")
    run_tests()
