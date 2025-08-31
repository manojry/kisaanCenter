#!/usr/bin/env python3
"""
Simple route verification without Unicode characters
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_routes():
    """Check if routes are properly registered"""
    try:
        from src.main import app
        
        print("Registered Routes")
        print("=" * 50)
        
        transaction_routes = []
        all_routes = []
        
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                for method in route.methods:
                    if method != 'HEAD':
                        route_info = f"{method:8} {route.path}"
                        all_routes.append(route_info)
                        if '/transactions' in route.path:
                            transaction_routes.append(route_info)
        
        print("\nTRANSACTION ROUTES:")
        print("-" * 30)
        for route in transaction_routes:
            print(f"  {route}")
        
        print(f"\nSUMMARY:")
        print(f"  Transaction routes: {len(transaction_routes)}")
        print(f"  Total routes: {len(all_routes)}")
        
        # Check for key endpoints
        paths = [route.path for route in app.routes if hasattr(route, 'path')]
        
        key_endpoints = [
            "/api/v1/transactions",
            "/api/v1/transactions/{transaction_id}",
            "/api/v1/transactions/shop/{shop_id}/dashboard",
            "/api/v1/transactions/completion-status/{status}"
        ]
        
        print(f"\nKEY ENDPOINT CHECK:")
        for endpoint in key_endpoints:
            found = any(endpoint in path or path in endpoint for path in paths)
            status = "FOUND" if found else "MISSING"
            print(f"  {endpoint}: {status}")
        
        return len(transaction_routes) > 0
        
    except Exception as e:
        print(f"Error importing app: {e}")
        return False

if __name__ == "__main__":
    success = check_routes()
    if success:
        print("\nRoutes loaded successfully!")
    else:
        print("\nFailed to load routes!")