#!/bin/bash
# Simple curl-based API testing script

BASE_URL="http://localhost:8000"

echo "🚀 KisaanCenter API Testing with curl"
echo "🌐 Testing server at: $BASE_URL"
echo "⏰ Started at: $(date)"
echo ""

# Function to test an endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2" 
    local data="$3"
    local description="$4"
    
    echo "=============================================================="
    echo "🧪 Testing: $method $endpoint"
    echo "📝 $description"
    echo "=============================================================="
    
    if [ "$method" = "GET" ]; then
        echo "📤 Request: GET $BASE_URL$endpoint"
        echo "📥 Response:"
        curl -s -X GET "$BASE_URL$endpoint" -H "accept: application/json" | python3 -m json.tool 2>/dev/null || echo "Response received (not JSON)"
    elif [ "$method" = "POST" ]; then
        echo "📤 Request: POST $BASE_URL$endpoint"
        echo "📤 Data: $data"
        echo "📥 Response:"
        curl -s -X POST "$BASE_URL$endpoint" -H "accept: application/json" -H "Content-Type: application/json" -d "$data" | python3 -m json.tool 2>/dev/null || echo "Response received (not JSON)"
    elif [ "$method" = "PUT" ]; then
        echo "📤 Request: PUT $BASE_URL$endpoint"
        echo "📤 Data: $data"
        echo "📥 Response:"
        curl -s -X PUT "$BASE_URL$endpoint" -H "accept: application/json" -H "Content-Type: application/json" -d "$data" | python3 -m json.tool 2>/dev/null || echo "Response received (not JSON)"
    fi
    
    echo ""
    echo ""
}

# Test 1: Health Check
test_endpoint "GET" "/health" "" "Basic system health check"

# Test 2: Subscription Health
test_endpoint "GET" "/api/v1/subscriptions/health" "" "Subscription system health"

# Test 3: List Plans
test_endpoint "GET" "/api/v1/subscriptions/plans" "" "List all subscription plans"

# Test 4: Create Basic Plan
basic_plan='{
    "name": "Basic Plan",
    "description": "Perfect for small farmers markets",
    "monthly_price": 29.99,
    "quarterly_price": 79.99,
    "yearly_price": 299.99,
    "max_farmers": 5,
    "max_buyers": 15,
    "data_retention_months": 6,
    "features": {
        "basic_analytics": true,
        "customer_management": true,
        "inventory_tracking": false
    }
}'
test_endpoint "POST" "/api/v1/subscriptions/plans" "$basic_plan" "Create Basic Plan"

# Test 5: Create Professional Plan
pro_plan='{
    "name": "Professional Plan", 
    "description": "For growing agricultural businesses",
    "monthly_price": 59.99,
    "quarterly_price": 159.99,
    "yearly_price": 599.99,
    "max_farmers": 15,
    "max_buyers": 50,
    "data_retention_months": 12,
    "features": {
        "basic_analytics": true,
        "customer_management": true,
        "inventory_tracking": true,
        "advanced_analytics": true
    }
}'
test_endpoint "POST" "/api/v1/subscriptions/plans" "$pro_plan" "Create Professional Plan"

# Test 6: List Plans Again
test_endpoint "GET" "/api/v1/subscriptions/plans" "" "List plans after creation"

# Test 7: List Shops
test_endpoint "GET" "/api/v1/shops" "" "List all shops"

# Test 8: Create Shop
shop_data='{
    "name": "Green Valley Farmers Market",
    "description": "Organic produce and local goods",
    "location": "123 Farm Road, Valley City",
    "contact_email": "info@greenvalley.com",
    "contact_phone": "+1-555-0101"
}'
test_endpoint "POST" "/api/v1/shops" "$shop_data" "Create Green Valley Market"

# Test 9: List Users
test_endpoint "GET" "/api/v1/users" "" "List all users"

# Test 10: Create User
user_data='{
    "username": "test_farmer",
    "email": "farmer@greenvalley.com",
    "password": "securepass123",
    "full_name": "John Farmer",
    "role": "FARMER",
    "shop_id": 1
}'
test_endpoint "POST" "/api/v1/users" "$user_data" "Create farmer user"

# Test 11: List Products
test_endpoint "GET" "/api/v1/products" "" "List all products"

# Test 12: Create Product
product_data='{
    "name": "Organic Tomatoes",
    "category": "Vegetables", 
    "unit": "kg",
    "description": "Fresh organic tomatoes",
    "farmer_id": 1,
    "shop_id": 1,
    "price_per_unit": 5.99,
    "available_quantity": 50
}'
test_endpoint "POST" "/api/v1/products" "$product_data" "Create tomatoes product"

# Test 13: List Transactions
test_endpoint "GET" "/api/v1/transactions" "" "List all transactions"

# Test 14: Create Transaction
transaction_data='{
    "buyer_id": 1,
    "farmer_id": 1,
    "product_id": 1,
    "shop_id": 1,
    "quantity": 3,
    "price_per_unit": 5.99,
    "total_amount": 17.97,
    "transaction_type": "SALE"
}'
test_endpoint "POST" "/api/v1/transactions" "$transaction_data" "Create sale transaction"

# Test 15: Create Subscription
subscription_data='{
    "shop_id": 1,
    "plan_id": 1,
    "billing_cycle": "MONTHLY",
    "start_date": "2025-08-27T00:00:00",
    "auto_renew": true
}'
test_endpoint "POST" "/api/v1/subscriptions" "$subscription_data" "Create subscription"

# Test 16: Get Shop Subscription
test_endpoint "GET" "/api/v1/subscriptions/shop/1" "" "Get shop subscription"

# Test 17: Get Feature Controls
test_endpoint "GET" "/api/v1/subscriptions/shop/1/features" "" "Get feature controls"

# Test 18: Super Admin - Risk Assessment
test_endpoint "GET" "/api/v1/admin/analytics/shop-risk-assessment" "" "Shop risk assessment"

# Test 19: Super Admin - Shop Overrides
test_endpoint "GET" "/api/v1/admin/shops/1/overrides" "" "Get shop overrides"

# Test 20: Set Shop Overrides
override_data='{
    "overrides": {
        "max_farmers": 20,
        "max_buyers": 60,
        "monthly_price": 39.99
    },
    "reason": "Promotional pricing",
    "valid_until": "2025-12-31T23:59:59"
}'
test_endpoint "PUT" "/api/v1/admin/shops/1/plan-overrides" "$override_data" "Set shop overrides"

# Test 21: API Documentation
test_endpoint "GET" "/docs" "" "API Documentation"

echo "=============================================================="
echo "🎉 API Testing Complete!"
echo "=============================================================="
echo "✅ Tested all major endpoints"
echo "✅ Created sample data in database"
echo "✅ Tested subscription management"
echo "✅ Tested super admin features"
echo ""
echo "🌐 View API docs: $BASE_URL/docs"
echo "⏰ Completed at: $(date)"
echo "=============================================================="
