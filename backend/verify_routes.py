#!/usr/bin/env python3
"""
Verify that all routes are properly registered
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.main import app

def list_routes():
    """List all registered routes"""
    print("🛣️  Registered Routes")
    print("=" * 60)
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            for method in route.methods:
                if method != 'HEAD':  # Skip HEAD methods
                    routes.append((method, route.path))
    
    # Sort routes by path
    routes.sort(key=lambda x: x[1])
    
    transaction_routes = []
    other_routes = []
    
    for method, path in routes:
        route_info = f"{method:8} {path}"
        if '/transactions' in path:
            transaction_routes.append(route_info)
        else:
            other_routes.append(route_info)
    
    print("\n🔄 TRANSACTION ROUTES:")
    print("-" * 40)
    for route in transaction_routes:
        print(f"  {route}")
    
    print(f"\n📊 OTHER ROUTES ({len(other_routes)} total):")
    print("-" * 40)
    for route in other_routes[:10]:  # Show first 10
        print(f"  {route}")
    
    if len(other_routes) > 10:
        print(f"  ... and {len(other_routes) - 10} more routes")
    
    print(f"\n📈 SUMMARY:")
    print(f"  Transaction routes: {len(transaction_routes)}")
    print(f"  Total routes: {len(routes)}")
    
    # Check for specific missing routes
    missing_routes = []
    expected_transaction_routes = [
        "/api/v1/transactions",
        "/api/v1/transactions/completion-status/{status}",
        "/api/v1/transactions/shop/{shop_id}/dashboard"
    ]
    
    registered_paths = [path for _, path in routes]
    
    for expected in expected_transaction_routes:
        # Check if any registered path matches the pattern
        found = any(expected.replace('{', '').replace('}', '') in path.replace('{', '').replace('}', '') 
                   for path in registered_paths)
        if not found:
            missing_routes.append(expected)
    
    if missing_routes:
        print(f"\n⚠️  POTENTIALLY MISSING ROUTES:")
        for route in missing_routes:
            print(f"  {route}")
    else:
        print(f"\n✅ All expected transaction routes found!")

if __name__ == "__main__":
    try:
        list_routes()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()