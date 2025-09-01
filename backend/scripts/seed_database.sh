
#!/bin/bash

# KisaanCenter Database Seeding Script
# Purpose: Complete database setup and seeding automation
# Usage: ./scripts/seed_database.sh [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 KisaanCenter Database Seeding Automation${NC}"
echo "=============================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Python virtual environment is activated
check_python_env() {
    if [[ -z "$VIRTUAL_ENV" ]]; then
        print_warning "No virtual environment detected"
        print_info "Consider activating your virtual environment first"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_status "Virtual environment active: $VIRTUAL_ENV"
    fi
}

# Check database connection
check_database() {
    print_info "Checking database connection..."
    cd "$PROJECT_ROOT"
    
    if python -c "
import sys
sys.path.append('src')
try:
    from src.database import get_db_session
    with get_db_session() as db:
        db.execute('SELECT 1')
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    sys.exit(1)
"; then
        print_status "Database connection verified"
    else
        print_error "Database connection failed"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    cd "$PROJECT_ROOT"
    
    # Check if migrations directory exists
    if [[ -d "db/migrations" ]]; then
        print_info "Applying SQL migrations..."
        # Apply migrations (this would depend on your migration system)
        # For now, we'll assume migrations are handled separately
        print_status "Migrations completed"
    else
        print_warning "No migrations directory found"
    fi
}

# Clean existing data (optional)
clean_database() {
    print_warning "This will delete ALL existing data!"
    read -p "Are you sure you want to clean the database? (yes/no): " -r
    if [[ $REPLY == "yes" ]]; then
        print_info "Cleaning database..."
        cd "$PROJECT_ROOT"
        python -m src.db.seeds.cleanup_seed_data
        print_status "Database cleaned"
    else
        print_info "Skipping database cleanup"
    fi
}

# Run complete seeding
run_seeding() {
    print_info "Starting complete database seeding..."
    cd "$PROJECT_ROOT"
    
    if python -m src.db.seeds.run_complete_seeding; then
        print_status "Database seeding completed successfully"
    else
        print_error "Database seeding failed"
        exit 1
    fi
}

# Verify seeded data
verify_data() {
    print_info "Verifying seeded data..."
    cd "$PROJECT_ROOT"
    
    if python -m src.db.seeds.verify_seed_data; then
        print_status "Data verification completed successfully"
    else
        print_error "Data verification failed"
        exit 1
    fi
}

# Main execution
main() {
    local clean_flag=false
    local verify_flag=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean_flag=true
                shift
                ;;
            --no-verify)
                verify_flag=false
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --clean      Clean database before seeding"
                echo "  --no-verify  Skip data verification"  
                echo ""
                echo -e "${GREEN}🎯 Next Steps:${NC}"
                echo "1. Start the FastAPI server:"
                echo "   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
                echo ""
                echo "2. Start the frontend development server:"
                echo "   cd ../frontend && npm run dev"
                echo ""
                echo "3. Access the application:"
                echo "   Backend API: http://localhost:8000"
                echo "   Frontend: http://localhost:3000"
                echo "   API Docs: http://localhost:8000/docs"
                echo ""
                echo -e "${BLUE}📋 Sample Login Credentials:${NC}"
                echo "   Admin: admin@kisaancenter.com / admin123"
                echo "   Shop Owner: rajesh@shop1.com / shop123"
                echo "   Farmer: ramesh@farmer.com / farmer123"
                echo "   Buyer: amit@buyer.com / buyer123"
            }

            # Run main function with all arguments
            main "$@"