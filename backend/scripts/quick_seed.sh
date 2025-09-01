
#!/bin/bash

# Quick Database Seeding Script
# Purpose: Fast seeding for development without prompts
# Usage: ./scripts/quick_seed.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}⚡ Quick Database Seeding${NC}"
echo "=========================="

cd "$PROJECT_ROOT"

echo "🔄 Running complete seeding..."
python -m src.db.seeds.run_complete_seeding

echo ""
echo -e "${GREEN}✅ Quick seeding completed!${NC}"
echo "🚀 Ready to start development servers"
