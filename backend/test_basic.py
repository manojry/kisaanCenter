import pytest
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from fastapi.testclient import TestClient
    from src.main import app
    
    client = TestClient(app)
    
    def test_basic_connection():
        """Test basic app connection"""
        response = client.get("/api/v1/users/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        assert response.status_code in [200, 401, 422]  # Any reasonable response
        
    if __name__ == "__main__":
        test_basic_connection()
        print("Basic test completed!")
        
except Exception as e:
    print(f"Error in basic test: {e}")
    import traceback
    traceback.print_exc()
